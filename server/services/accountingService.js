const StoreAccounting = require('../models/StoreAccounting');
const WarpTransaction = require('../models/WarpTransaction');
const SongRequest = require('../models/SongRequest');

class AccountingService {
  /**
   * Calculate revenue for a store in a specific period
   */
  static async getStoreRevenue(storeId, period = 'current') {
    try {
      let startDate, endDate;
      
      // Determine date range based on period
      const now = new Date();
      switch (period) {
        case 'current':
          // Current month
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        case 'last':
          // Last month
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
          break;
        case 'year':
          // Current year
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
          break;
        default:
          // Custom period (should be passed as date range)
          startDate = new Date(period.start);
          endDate = new Date(period.end);
      }

      // Get warp transactions revenue
      const warpTransactions = await WarpTransaction.find({
        store: storeId,
        status: 'completed',
        createdAt: { $gte: startDate, $lte: endDate }
      }).lean();

      // Get song requests revenue
      const songRequests = await SongRequest.find({
        store: storeId,
        status: { $in: ['paid', 'playing', 'played'] },
        createdAt: { $gte: startDate, $lte: endDate }
      }).lean();

      // Calculate total revenue
      const warpRevenue = warpTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
      const songRevenue = songRequests.reduce((sum, sr) => sum + (sr.amount || 0), 0);
      const totalRevenue = warpRevenue + songRevenue;

      return {
        storeId,
        period: {
          startDate,
          endDate,
          type: period
        },
        revenue: {
          warpTransactions: {
            count: warpTransactions.length,
            amount: warpRevenue
          },
          songRequests: {
            count: songRequests.length,
            amount: songRevenue
          },
          total: totalRevenue
        },
        transactions: {
          warp: warpTransactions.length,
          song: songRequests.length,
          total: warpTransactions.length + songRequests.length
        }
      };
    } catch (error) {
      console.error('Error calculating store revenue:', error);
      throw error;
    }
  }

  /**
   * Calculate settlement breakdown for a store
   */
  static async calculateSettlement(storeId, period = 'current') {
    try {
      // Get accounting settings for the store
      const accounting = await StoreAccounting.findOne({ store: storeId });
      if (!accounting) {
        throw new Error('Accounting settings not found for store');
      }

      // Get revenue data
      const revenueData = await this.getStoreRevenue(storeId, period);
      const totalRevenue = revenueData.revenue.total;

      // Calculate breakdown
      const taxAmount = (totalRevenue * accounting.taxRate) / 100;
      const apiGatewayFee = (totalRevenue * accounting.apiGatewayFeeRate) / 100;
      const ownerShare = (totalRevenue * accounting.ownerShareRate) / 100;
      const storeRevenue = (totalRevenue * accounting.storeRevenueRate) / 100;

      return {
        storeId,
        period: revenueData.period,
        revenue: revenueData,
        settlement: {
          totalRevenue,
          deductions: {
            tax: {
              rate: accounting.taxRate,
              amount: taxAmount
            },
            apiGatewayFee: {
              rate: accounting.apiGatewayFeeRate,
              amount: apiGatewayFee
            },
            ownerShare: {
              rate: accounting.ownerShareRate,
              amount: ownerShare
            }
          },
          netAmounts: {
            storeRevenue: {
              rate: accounting.storeRevenueRate,
              amount: storeRevenue
            },
            ownerShare: {
              rate: accounting.ownerShareRate,
              amount: ownerShare
            }
          },
          summary: {
            grossRevenue: totalRevenue,
            totalDeductions: taxAmount + apiGatewayFee,
            netRevenue: totalRevenue - taxAmount - apiGatewayFee,
            storeShare: storeRevenue,
            ownerShare: ownerShare
          }
        }
      };
    } catch (error) {
      console.error('Error calculating settlement:', error);
      throw error;
    }
  }

  /**
   * Get accounting summary for all stores
   */
  static async getAllStoresSummary(period = 'current') {
    try {
      const accountingSettings = await StoreAccounting.find({ isActive: true })
        .populate('store', 'name slug')
        .sort({ 'store.name': 1 });

      const summary = await Promise.all(
        accountingSettings.map(async (accounting) => {
          try {
            const settlement = await this.calculateSettlement(accounting.store._id, period);
            return {
              store: accounting.store,
              accounting: {
                taxRate: accounting.taxRate,
                ownerShareRate: accounting.ownerShareRate,
                apiGatewayFeeRate: accounting.apiGatewayFeeRate,
                storeRevenueRate: accounting.storeRevenueRate,
              },
              settlement: settlement.settlement
            };
          } catch (error) {
            console.error(`Error calculating settlement for store ${accounting.store._id}:`, error);
            return {
              store: accounting.store,
              error: error.message,
              settlement: null
            };
          }
        })
      );

      // Calculate totals
      const totals = summary.reduce((acc, item) => {
        if (item.settlement) {
          acc.totalRevenue += item.settlement.summary.grossRevenue;
          acc.totalTax += item.settlement.deductions.tax.amount;
          acc.totalApiFee += item.settlement.deductions.apiGatewayFee.amount;
          acc.totalOwnerShare += item.settlement.netAmounts.ownerShare.amount;
          acc.totalStoreRevenue += item.settlement.netAmounts.storeRevenue.amount;
        }
        return acc;
      }, {
        totalRevenue: 0,
        totalTax: 0,
        totalApiFee: 0,
        totalOwnerShare: 0,
        totalStoreRevenue: 0
      });

      return {
        period,
        summary,
        totals
      };
    } catch (error) {
      console.error('Error getting all stores summary:', error);
      throw error;
    }
  }

  /**
   * Generate accounting report for a specific store
   */
  static async generateStoreReport(storeId, period = 'current') {
    try {
      const settlement = await this.calculateSettlement(storeId, period);
      const accounting = await StoreAccounting.findOne({ store: storeId })
        .populate('store', 'name slug')
        .populate('createdBy', 'email displayName')
        .populate('updatedBy', 'email displayName');

      return {
        store: accounting.store,
        accounting: accounting,
        report: {
          period: settlement.period,
          revenue: settlement.revenue,
          settlement: settlement.settlement,
          generatedAt: new Date(),
          generatedBy: 'system'
        }
      };
    } catch (error) {
      console.error('Error generating store report:', error);
      throw error;
    }
  }

  /**
   * Get weekly settlement for a store
   */
  static async getWeeklySettlement(storeId, week, year) {
    try {
      // Calculate start and end dates for the week
      const startDate = getDateFromWeek(week, year);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);

      // Get accounting settings for the store
      const accounting = await StoreAccounting.findOne({ store: storeId });
      if (!accounting) {
        throw new Error('Accounting settings not found for store');
      }

      // Get revenue data for the week
      const warpTransactions = await WarpTransaction.find({
        store: storeId,
        status: 'completed',
        createdAt: { $gte: startDate, $lte: endDate }
      }).lean();

      const songRequests = await SongRequest.find({
        store: storeId,
        status: { $in: ['paid', 'playing', 'played'] },
        createdAt: { $gte: startDate, $lte: endDate }
      }).lean();

      // Calculate total revenue
      const warpRevenue = warpTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
      const songRevenue = songRequests.reduce((sum, sr) => sum + (sr.amount || 0), 0);
      const totalRevenue = warpRevenue + songRevenue;

      // Calculate settlement using the store's accounting settings
      const taxAmount = accounting.calculateTax(totalRevenue);
      const apiGatewayFee = (totalRevenue * accounting.apiGatewayFeeRate) / 100;
      const ownerShare = (totalRevenue * accounting.ownerShareRate) / 100;
      const storeRevenue = totalRevenue - taxAmount - apiGatewayFee - ownerShare;

      return {
        storeId,
        week,
        year,
        period: {
          startDate,
          endDate,
          week,
          year
        },
        revenue: {
          warpTransactions: {
            count: warpTransactions.length,
            amount: warpRevenue
          },
          songRequests: {
            count: songRequests.length,
            amount: songRevenue
          },
          total: totalRevenue
        },
        settlement: {
          totalRevenue,
          deductions: {
            tax: {
              rate: accounting.taxRate,
              amount: taxAmount
            },
            apiGatewayFee: {
              rate: accounting.apiGatewayFeeRate,
              amount: apiGatewayFee
            },
            ownerShare: {
              rate: accounting.ownerShareRate,
              amount: ownerShare
            }
          },
          netAmounts: {
            storeRevenue: {
              rate: accounting.storeRevenueRate,
              amount: storeRevenue
            },
            ownerShare: {
              rate: accounting.ownerShareRate,
              amount: ownerShare
            }
          },
          summary: {
            grossRevenue: totalRevenue,
            totalDeductions: taxAmount + apiGatewayFee + ownerShare,
            netRevenue: totalRevenue - taxAmount - apiGatewayFee - ownerShare,
            storeShare: storeRevenue,
            ownerShare: ownerShare
          }
        }
      };
    } catch (error) {
      console.error('Error getting weekly settlement:', error);
      throw error;
    }
  }

  /**
   * Update last settlement for a store
   */
  static async updateLastSettlement(storeId, settlement) {
    try {
      await StoreAccounting.findOneAndUpdate(
        { store: storeId },
        {
          lastSettlement: {
            date: new Date(),
            totalRevenue: settlement.summary.grossRevenue,
            taxAmount: settlement.deductions.tax.amount,
            apiGatewayFee: settlement.deductions.apiGatewayFee.amount,
            ownerShare: settlement.netAmounts.ownerShare.amount,
            storeRevenue: settlement.netAmounts.storeRevenue.amount,
          }
        }
      );
    } catch (error) {
      console.error('Error updating last settlement:', error);
      throw error;
    }
  }
}

// Helper function to get date from week number
function getDateFromWeek(week, year) {
  const d = new Date(Date.UTC(year, 0, 1));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const weekStart = new Date(d.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
  return weekStart;
}

module.exports = AccountingService;

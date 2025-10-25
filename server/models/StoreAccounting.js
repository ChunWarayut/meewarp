const mongoose = require('mongoose');

const StoreAccountingSchema = new mongoose.Schema({
  // Store Reference
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
    unique: true,
  },
  
  // Tax Settings
  taxRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0, // ภาษี 0-100%
  },
  
  // Advanced Tax Settings
  taxType: {
    type: String,
    enum: ['flat', 'progressive', 'bracket'],
    default: 'flat',
  },
  
  // Progressive Tax Brackets
  taxBrackets: [{
    minAmount: { type: Number, default: 0 },
    maxAmount: { type: Number, default: Number.MAX_SAFE_INTEGER },
    rate: { type: Number, min: 0, max: 100 },
    description: String,
  }],
  
  // Business Type Tax Settings
  businessType: {
    type: String,
    enum: ['individual', 'company', 'partnership', 'franchise'],
    default: 'individual',
  },
  
  // Tax Exemptions
  taxExemptions: {
    personalAllowance: { type: Number, default: 150000 }, // ค่าลดหย่อนส่วนตัว
    businessExpenses: { type: Number, default: 50 }, // ค่าใช้จ่ายธุรกิจ (%)
    otherDeductions: { type: Number, default: 0 }, // การลดหย่อนอื่นๆ
  },
  
  // API Gateway Fee (Fixed 3%)
  apiGatewayFeeRate: {
    type: Number,
    default: 3,
    min: 0,
    max: 100,
  },
  
  // Owner Share Settings
  ownerShareRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 10, // เจ้าของระบบได้ 10%
  },
  
  // Store Revenue Settings
  storeRevenueRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 87, // ร้านได้ 87% (100% - 3% API - 10% Owner)
  },
  
  // Accounting Period
  accountingPeriod: {
    type: String,
    enum: ['monthly', 'weekly', 'daily'],
    default: 'monthly',
  },
  
  // Last Settlement
  lastSettlement: {
    date: Date,
    totalRevenue: Number,
    taxAmount: Number,
    apiGatewayFee: Number,
    ownerShare: Number,
    storeRevenue: Number,
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // Notes
  notes: {
    type: String,
    maxLength: 500,
  },
  
  // Created/Updated by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
}, {
  timestamps: true,
});

// Index for efficient queries
StoreAccountingSchema.index({ store: 1 });
StoreAccountingSchema.index({ isActive: 1 });

// Virtual for calculated rates validation
StoreAccountingSchema.virtual('totalRate').get(function() {
  return this.taxRate + this.apiGatewayFeeRate + this.ownerShareRate + this.storeRevenueRate;
});

// Pre-save validation
StoreAccountingSchema.pre('save', function(next) {
  const apiGatewayFeeRate = this.apiGatewayFeeRate || 0;
  const ownerShareRate = this.ownerShareRate || 0;
  const taxRate = this.taxRate || 0;

  // Ensure storeRevenueRate always reflects what is left after the other
  // configured rates. We compute the remaining room before validating so we
  // don't reject legitimate payloads that rely on this auto-calculation.
  if (this.taxType === 'flat') {
    const remainingRate = 100 - (taxRate + apiGatewayFeeRate + ownerShareRate);
    if (remainingRate < 0) {
      return next(new Error('Tax + API Gateway Fee + Owner Share cannot exceed 100%'));
    }

    this.storeRevenueRate = Number(remainingRate.toFixed(2));

    const totalRate = taxRate + apiGatewayFeeRate + ownerShareRate + this.storeRevenueRate;
    if (Math.abs(totalRate - 100) > 0.01) {
      return next(new Error('Total rate must equal 100%'));
    }
  } else {
    const remainingRate = 100 - (apiGatewayFeeRate + ownerShareRate);
    if (remainingRate < 0) {
      return next(new Error('API Gateway Fee + Owner Share cannot exceed 100%'));
    }

    this.storeRevenueRate = Number(remainingRate.toFixed(2));

    const nonTaxRate = apiGatewayFeeRate + ownerShareRate + this.storeRevenueRate;
    if (nonTaxRate > 100.01) {
      return next(new Error('API Gateway Fee + Owner Share + Store Revenue cannot exceed 100%'));
    }
  }
  
  next();
});

// Method to calculate settlement
StoreAccountingSchema.methods.calculateSettlement = function(totalRevenue) {
  const taxAmount = this.calculateTax(totalRevenue);
  const apiGatewayFee = (totalRevenue * this.apiGatewayFeeRate) / 100;
  const ownerShare = (totalRevenue * this.ownerShareRate) / 100;
  const storeRevenue = (totalRevenue * this.storeRevenueRate) / 100;
  
  return {
    totalRevenue,
    taxAmount,
    apiGatewayFee,
    ownerShare,
    storeRevenue,
    breakdown: {
      taxRate: this.taxRate,
      apiGatewayFeeRate: this.apiGatewayFeeRate,
      ownerShareRate: this.ownerShareRate,
      storeRevenueRate: this.storeRevenueRate,
    }
  };
};

// Method to calculate tax based on tax type
StoreAccountingSchema.methods.calculateTax = function(totalRevenue) {
  // Apply tax exemptions first
  const taxableIncome = this.calculateTaxableIncome(totalRevenue);
  
  switch (this.taxType) {
    case 'flat':
      return (taxableIncome * this.taxRate) / 100;
    
    case 'progressive':
      return this.calculateProgressiveTax(taxableIncome);
    
    case 'bracket':
      return this.calculateBracketTax(taxableIncome);
    
    default:
      return (taxableIncome * this.taxRate) / 100;
  }
};

// Method to calculate taxable income after exemptions
StoreAccountingSchema.methods.calculateTaxableIncome = function(totalRevenue) {
  let taxableIncome = totalRevenue;
  
  // Subtract personal allowance
  taxableIncome = Math.max(0, taxableIncome - this.taxExemptions.personalAllowance);
  
  // Subtract business expenses (percentage)
  const businessExpenseAmount = (totalRevenue * this.taxExemptions.businessExpenses) / 100;
  taxableIncome = Math.max(0, taxableIncome - businessExpenseAmount);
  
  // Subtract other deductions
  taxableIncome = Math.max(0, taxableIncome - this.taxExemptions.otherDeductions);
  
  return taxableIncome;
};

// Method to calculate progressive tax
StoreAccountingSchema.methods.calculateProgressiveTax = function(taxableIncome) {
  if (this.taxBrackets.length === 0) {
    return (taxableIncome * this.taxRate) / 100;
  }
  
  let totalTax = 0;
  let remainingIncome = taxableIncome;
  
  for (const bracket of this.taxBrackets) {
    if (remainingIncome <= 0) break;
    
    const bracketIncome = Math.min(remainingIncome, bracket.maxAmount - bracket.minAmount);
    const bracketTax = (bracketIncome * bracket.rate) / 100;
    totalTax += bracketTax;
    remainingIncome -= bracketIncome;
  }
  
  return totalTax;
};

// Method to calculate bracket tax
StoreAccountingSchema.methods.calculateBracketTax = function(taxableIncome) {
  if (this.taxBrackets.length === 0) {
    return (taxableIncome * this.taxRate) / 100;
  }
  
  // Find the appropriate bracket
  for (const bracket of this.taxBrackets) {
    if (taxableIncome >= bracket.minAmount && taxableIncome <= bracket.maxAmount) {
      return (taxableIncome * bracket.rate) / 100;
    }
  }
  
  // If no bracket matches, use the last bracket
  const lastBracket = this.taxBrackets[this.taxBrackets.length - 1];
  return (taxableIncome * lastBracket.rate) / 100;
};

// Method to get current period revenue
StoreAccountingSchema.methods.getCurrentPeriodRevenue = async function() {
  const now = new Date();
  let startDate;
  
  switch (this.accountingPeriod) {
    case 'daily':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'weekly':
      const dayOfWeek = now.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate = new Date(now);
      startDate.setDate(now.getDate() - daysToSubtract);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  
  // This would need to be implemented based on your revenue calculation logic
  // For now, returning a placeholder
  return {
    startDate,
    endDate: now,
    totalRevenue: 0, // This should be calculated from actual transactions
  };
};

module.exports = mongoose.model('StoreAccounting', StoreAccountingSchema);

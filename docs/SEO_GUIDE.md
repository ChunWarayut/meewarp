# SEO Guide สำหรับ MeeWarp

## ภาพรวมการปรับปรุง SEO

### 1. Meta Tags ที่เพิ่มเข้ามา
- **Primary Meta Tags**: title, description, keywords, author, robots, language
- **Open Graph Tags**: สำหรับ Facebook และ social media sharing
- **Twitter Card Tags**: สำหรับ Twitter sharing
- **PWA Meta Tags**: สำหรับ Progressive Web App
- **Canonical URL**: ป้องกัน duplicate content

### 2. Structured Data (JSON-LD)
- ใช้ Schema.org markup สำหรับ SoftwareApplication
- ช่วยให้ search engines เข้าใจเนื้อหาของเว็บไซต์ได้ดีขึ้น
- รองรับ rich snippets ในผลการค้นหา

### 3. Technical SEO Files
- **sitemap.xml**: แผนที่เว็บไซต์สำหรับ search engines
- **robots.txt**: คำแนะนำสำหรับ web crawlers
- **manifest.json**: PWA configuration

### 4. Performance Optimizations
- **Vite Build Config**: การตั้งค่าสำหรับ production build
- **Code Splitting**: แบ่งโค้ดเป็น chunks เพื่อโหลดเร็วขึ้น
- **Tree Shaking**: ลบโค้ดที่ไม่ใช้
- **Minification**: บีบอัดโค้ดให้เล็กลง

## การใช้งาน SEOHead Component

```tsx
import SEOHead from '../components/SEOHead';

// ใช้งานในหน้าใดก็ได้
<SEOHead
  title="หน้าเฉพาะ - MeeWarp"
  description="คำอธิบายหน้าเฉพาะ"
  keywords="คำสำคัญเพิ่มเติม"
  image="https://meewarp.com/custom-image.png"
  url="https://meewarp.com/specific-page"
  type="article"
/>
```

## การตั้งค่า Google Analytics

1. **เปลี่ยน GA_MEASUREMENT_ID** ใน index.html เป็น Measurement ID จริง
2. **เปลี่ยน GOOGLE_SITE_VERIFICATION_CODE** เป็น verification code จาก Google Search Console
3. **ตั้งค่า Custom Events** สำหรับ tracking user interactions

## การตรวจสอบ SEO

### 1. Google Search Console
- ยืนยันการเป็นเจ้าของเว็บไซต์
- ส่ง sitemap.xml
- ตรวจสอบ Core Web Vitals

### 2. Google PageSpeed Insights
- ตรวจสอบ performance score
- ดู Core Web Vitals metrics
- รับคำแนะนำการปรับปรุง

### 3. SEO Testing Tools
- **Lighthouse**: ตรวจสอบ SEO, Performance, Accessibility
- **GTmetrix**: วิเคราะห์ความเร็วเว็บไซต์
- **Screaming Frog**: ตรวจสอบ technical SEO

## คำแนะนำการปรับปรุงเพิ่มเติม

### 1. Content SEO
- เพิ่มเนื้อหาที่มีคุณภาพและเป็นประโยชน์
- ใช้ keywords อย่างเป็นธรรมชาติ
- สร้าง internal linking structure

### 2. Local SEO (สำหรับร้านค้า)
- เพิ่ม Google My Business listing
- ใช้ local keywords
- เพิ่ม structured data สำหรับ LocalBusiness

### 3. Mobile SEO
- ปรับปรุง mobile-first design
- ตรวจสอบ mobile usability
- ใช้ responsive images

### 4. Security SEO
- ใช้ HTTPS
- ตั้งค่า security headers
- ป้องกัน spam และ malicious content

## การติดตามผลลัพธ์

### 1. Key Metrics
- **Organic Traffic**: จำนวนผู้เข้าชมจาก search engines
- **Keyword Rankings**: ตำแหน่งในผลการค้นหา
- **Click-Through Rate (CTR)**: อัตราการคลิกจากผลการค้นหา
- **Core Web Vitals**: LCP, FID, CLS

### 2. Tools สำหรับติดตาม
- Google Analytics 4
- Google Search Console
- Google Tag Manager
- Hotjar (สำหรับ user behavior)

## การบำรุงรักษา SEO

### 1. ตรวจสอบเป็นประจำ
- ตรวจสอบ broken links
- อัปเดต sitemap.xml
- ตรวจสอบ page speed
- วิเคราะห์ competitor SEO

### 2. การอัปเดตเนื้อหา
- เพิ่มเนื้อหาใหม่เป็นประจำ
- อัปเดต meta descriptions
- ปรับปรุง internal linking
- ตรวจสอบ keyword performance

### 3. Technical Maintenance
- ตรวจสอบ server response time
- อัปเดต dependencies
- ตรวจสอบ mobile compatibility
- ปรับปรุง security measures

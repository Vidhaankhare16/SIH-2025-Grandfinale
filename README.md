# KisanSetu - Smart Agricultural Supply Chain Platform

🌾 **Live Demo**: [https://sih-8e6n53zfa-vidhaan-khares-projects.vercel.app/](https://sih-8e6n53zfa-vidhaan-khares-projects.vercel.app/)

## 🚀 Overview

KisanSetu is a comprehensive digital platform designed to revolutionize the agricultural supply chain in Odisha, India. Built for the Smart India Hackathon 2025, it connects farmers, FPOs (Farmer Producer Organizations), processors, retailers, and government agencies through an integrated ecosystem that promotes oilseed cultivation and efficient market operations.

## ✨ Key Features

### 🌱 For Farmers
- **AI-Powered Crop Advisory**: Weather-aware recommendations for optimal oilseed cultivation
- **Real-time Bidding System**: Direct connection with FPOs for better crop prices
- **Voice Assistant**: Multilingual support (English/Odia) for accessibility
- **Financial Planning**: ROI calculations and profit optimization tools
- **Soil Health Integration**: Personalized recommendations based on soil health cards
- **Market Price Tracking**: Real-time MSP and market price information

### 🏢 For FPOs (Farmer Producer Organizations)
- **Warehouse Management**: Smart inventory tracking and optimization
- **Procurement Dashboard**: Real-time farmer listings and bidding interface
- **Sales Management**: Direct sales to processors with automated matching
- **Logistics Optimization**: AI-powered route planning and storage recommendations
- **Analytics Dashboard**: Performance metrics and market insights

### 🏭 For Processors
- **Supply Chain Visibility**: Real-time access to FPO inventory and offerings
- **Automated Procurement**: Streamlined purchasing from multiple FPOs
- **Quality Tracking**: Integration with quality parameters and certifications
- **Demand Forecasting**: AI-driven insights for production planning

### 🏪 For Retailers
- **Product Sourcing**: Direct access to processed oilseed products
- **Inventory Management**: Stock tracking and automated reordering
- **Market Analytics**: Consumer demand patterns and pricing insights

### 🏛️ For Government
- **Policy Dashboard**: Real-time monitoring of scheme implementations
- **Subsidy Management**: Automated distribution and tracking
- **Market Oversight**: Price monitoring and intervention capabilities
- **Data Analytics**: Comprehensive insights for policy decisions

## 🛠️ Technology Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for responsive design
- **Lucide React** for icons
- **Recharts** for data visualization

### Backend & Database
- **Supabase** for real-time database and authentication
- **PostgreSQL** with Row Level Security (RLS)
- **Real-time subscriptions** for live updates

### AI & Machine Learning
- **Google Gemini AI** for crop advisory and insights
- **Weather API Integration** for climate-aware recommendations
- **Natural Language Processing** for voice assistant

### Blockchain & NFT (Optional Module)
- **Ethereum/Polygon** smart contracts
- **Hardhat** development framework
- **IPFS** for decentralized storage
- **NFT-based farmer credit profiles**

### DevOps & Deployment
- **Vercel** for frontend deployment
- **GitHub Actions** for CI/CD
- **Environment-based configuration**

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (for database)
- Google Gemini API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Vidhaankhare16/SIH-2025-Grandfinale.git
   cd SIH-2025-Grandfinale
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Set up Supabase database**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and run the contents of `supabase-schema.sql`
   - Enable real-time replication for all tables in Database → Replication

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 📊 Database Schema

The platform uses a comprehensive PostgreSQL schema with the following key tables:

- **farmer_listings**: Crop listings from farmers
- **bids**: FPO bids on farmer listings
- **fpo_sales_offers**: FPO sales offers to processors
- **processor_purchases**: Processor purchase records
- **warehouse_inventory**: Real-time inventory tracking
- **user_profiles**: Multi-role user management

All tables include:
- Row Level Security (RLS) policies
- Real-time replication enabled
- Optimized indexes for performance
- Automatic triggers for status updates

## 🔄 Real-time Features

### Bidding System
```
Farmer creates listing → FPO sees instantly → FPO places bid → 
Farmer sees bid instantly → Farmer accepts → Status updates everywhere
```

### Supply Chain Flow
```
FPO creates sales offer → Processor sees instantly → 
Processor purchases → Inventory updates → Analytics refresh
```

### Voice Assistant
- Real-time speech recognition
- Multilingual support (English/Odia)
- Context-aware responses
- Integration with all platform features

## 🌐 API Integration

### Weather Services
- District-wise weather data for Odisha
- Rainfall patterns and climate zones
- Crop-specific weather recommendations

### Government Schemes
- NMEO-OP (National Mission on Edible Oils - Oil Palm)
- PM-KISAN integration
- Subsidy calculation and tracking

### Market Data
- Real-time MSP (Minimum Support Price)
- Market price tracking
- Demand-supply analytics

## 🔐 Security Features

- **Row Level Security (RLS)** on all database tables
- **Environment variable protection** for sensitive data
- **API key rotation** support
- **User role-based access control**
- **Data encryption** in transit and at rest

## 📱 Mobile Responsiveness

The platform is fully responsive and optimized for:
- Desktop browsers
- Tablet devices
- Mobile phones
- Progressive Web App (PWA) capabilities

## 🌍 Multilingual Support

- **English**: Full feature support
- **Odia (ଓଡ଼ିଆ)**: Native language support for Odisha farmers
- **Voice commands**: Both languages supported
- **Dynamic language switching**

## 🧪 Testing

### Real-time Testing
1. Open the app in multiple browsers
2. Login with different roles (Farmer, FPO, Processor)
3. Create listings/bids/offers
4. Observe real-time updates across all sessions

### Voice Assistant Testing
1. Click the microphone icon
2. Speak in English or Odia
3. Test various queries about crops, weather, prices
4. Verify multilingual responses

## 📈 Performance Optimization

- **Code splitting** for faster initial loads
- **Lazy loading** of components
- **Optimized database queries** with indexes
- **CDN delivery** via Vercel
- **Image optimization** and compression
- **Real-time connection pooling**

## 🔧 Configuration

### Environment Variables

#### Required
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_GEMINI_API_KEY`: Google Gemini API key for AI features

#### Optional
- `VITE_ENABLE_BLOCKCHAIN`: Enable blockchain features (default: false)
- `VITE_DEBUG_MODE`: Enable debug logging (default: false)

### Deployment on Vercel

1. **Connect your GitHub repository** to Vercel
2. **Add environment variables** in Vercel dashboard
3. **Deploy** - automatic deployments on every push to main branch

### Custom Domain Setup
1. Add your domain in Vercel dashboard
2. Configure DNS records
3. SSL certificates are automatically managed

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Write meaningful commit messages
- Add comments for complex logic
- Test real-time features thoroughly
- Ensure mobile responsiveness

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Smart India Hackathon 2025

This project was developed for SIH 2025 with the following problem statement:
**"Development of a comprehensive digital platform for promoting oilseed cultivation and establishing an efficient supply chain ecosystem in Odisha"**

### Team Lumora
- **Problem Statement ID**: [25270]
- **Category**: Software
- **Theme**: Agriculture & Rural Development



---

<div align="center">
<p><strong>Built with ❤️ for farmers of Odisha</strong></p>
<p>🌾 Empowering Agriculture Through Technology 🌾</p>
</div>

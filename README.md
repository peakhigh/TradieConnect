# TradieApp - React Native Expo App

A comprehensive mobile application that connects customers with trusted tradies (tradespeople) for home repair and maintenance services.

## 🚀 Features

### Customer Module
- **Phone-based OTP Authentication** - Secure login with phone number verification
- **Post Service Requests** - Create detailed service requests with trade type, description, photos, and voice messages
- **Dashboard** - View active requests, track quotes, and manage communications
- **Request History** - Complete history of all service requests with tradie details
- **Real-time Messaging** - Chat with tradies about quotes and job details

### Tradie Module
- **Professional Registration** - Complete onboarding with license, insurance, and business details
- **Service Request Explorer** - Browse and search available jobs with advanced filters
- **Unlock System** - Pay $0.50 to unlock full request details and submit quotes
- **Quote Management** - Submit detailed quotes with cost breakdown and timelines
- **Performance Tracking** - Monitor ratings, job completion rates, and earnings
- **Wallet System** - Manage credits for unlocking requests

### Admin Module
- **User Management** - Approve tradies, monitor customer accounts
- **Financial Oversight** - Track revenue, unlock transactions, and platform fees
- **System Monitoring** - Monitor platform health and performance metrics

## 🛠 Tech Stack

- **Frontend**: React Native + Expo
- **Backend**: Firebase (Auth, Firestore, Storage, Functions)
- **UI**: NativeWind (Tailwind CSS), Gluestack UI, Styled Components
- **Navigation**: React Navigation (Stack + Tab Navigators)
- **Language**: TypeScript
- **State Management**: React Context API
- **Authentication**: Firebase Phone Authentication
- **Database**: Firestore (NoSQL)
- **Storage**: Firebase Storage
- **Cloud Functions**: Firebase Cloud Functions for secure APIs

## 📱 Platform Support

- ✅ **iOS** - Native iOS app
- ✅ **Android** - Native Android app  
- ✅ **Web** - Responsive web application
- ✅ **Cross-platform** - Single codebase for all platforms

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Firebase CLI (`npm install -g firebase-tools`)
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tradie-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Setup**
   ```bash
   # Install Firebase CLI if not already installed
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize Firebase project
   firebase init
   ```

4. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
   ```

5. **Firebase Functions Setup**
   ```bash
   cd functions
   npm install
   npm run build
   ```

### Running the App

1. **Start the development server**
   ```bash
   npm start
   ```

2. **Run on specific platform**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   
   # Web
   npm run web
   ```

3. **Deploy Firebase Functions**
   ```bash
   cd functions
   npm run deploy
   ```

## 🏗 Project Structure

```
tradie-app/
├── app/
│   ├── components/
│   │   └── UI/                 # Reusable UI components
│   ├── context/                # React Context providers
│   ├── hooks/                  # Custom React hooks
│   ├── navigation/             # Navigation configuration
│   ├── screens/                # App screens
│   │   ├── admin/             # Admin module screens
│   │   ├── auth/              # Authentication screens
│   │   ├── customer/          # Customer module screens
│   │   ├── tradie/            # Tradie module screens
│   │   └── HomeScreen.tsx     # Marketing website (landing page)
│   ├── services/               # API and Firebase services
│   ├── types/                  # TypeScript type definitions
│   └── utils/                  # Utility functions
├── functions/                  # Firebase Cloud Functions
├── assets/                     # Images, icons, and static files
├── App.tsx                     # Main app component
└── package.json               # Dependencies and scripts
```

## 🔐 Firebase Configuration

### Collections Structure

- **users** - User profiles (customers, tradies, admins)
- **serviceRequests** - Customer service requests
- **quotes** - Tradie quotes for service requests
- **unlockTransactions** - Records of request unlocks
- **walletTransactions** - User wallet transactions
- **messages** - Chat messages between users
- **notifications** - Push notifications and alerts

### Security Rules

Firestore security rules ensure:
- Users can only access their own data
- Tradies must unlock requests before viewing full details
- Only admins can access admin-only collections
- Data integrity through validation rules

## 💰 Business Model

- **50¢ Market**: Tradies pay $0.50 to unlock each service request
- **Free for Customers**: No charges for posting service requests
- **Bonus Credits**: $10 signup bonus for new tradies
- **Minimum Recharge**: $5 minimum wallet recharge for tradies

## 🚀 Deployment

### Quick Deploy Commands

**Using npm scripts:**
```bash
npm run deploy           # Deploy React Native app
npm run deploy:functions # Deploy Firebase functions only
npm run deploy:all       # Deploy everything
```

**Using shell script directly:**
```bash
./deploy.sh app          # Deploy React Native app
./deploy.sh functions    # Deploy Firebase functions only
./deploy.sh all          # Deploy everything
./deploy.sh              # Show help menu
```

### What Each Command Does

- **`deploy`** - Builds and deploys the React Native app (includes marketing site)
- **`deploy:functions`** - Deploys Firebase Cloud Functions only
- **`deploy:all`** - Full deployment: app + functions

### Live URLs

- **App**: https://tradie-mate-f852a.web.app (Complete app with marketing site)
- **Console**: https://console.firebase.google.com/project/tradie-mate-f852a/overview

### Mobile Apps

1. **Build for production**
   ```bash
   expo build:ios
   expo build:android
   ```

2. **Submit to app stores**
   - iOS: Submit to App Store Connect
   - Android: Submit to Google Play Console

## 🔧 Development

### Code Style

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Husky**: Git hooks for quality checks

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Building

```bash
# Build for all platforms
npm run build

# Build specific platform
npm run build:ios
npm run build:android
npm run build:web
```

## 📊 Performance

- **Lazy Loading**: Screens and components loaded on demand
- **Image Optimization**: Compressed images and lazy loading
- **Caching**: Firebase offline persistence and local caching
- **Bundle Optimization**: Metro bundler optimizations

## 🔒 Security Features

- **Phone Authentication**: Secure OTP-based login
- **Data Encryption**: All sensitive data encrypted in transit and at rest
- **Role-based Access**: Different permissions for customers, tradies, and admins
- **Input Validation**: Server-side validation for all user inputs
- **Rate Limiting**: API rate limiting to prevent abuse

## 🌟 Key Benefits

### For Customers
- ✅ **Verified Tradies**: All tradies are licensed and insured
- ✅ **Multiple Quotes**: Get competitive pricing from multiple tradies
- ✅ **Secure Communication**: Built-in chat system for project discussions
- ✅ **Transparent Pricing**: Clear cost breakdowns and no hidden fees

### For Tradies
- ✅ **Quality Leads**: Pre-screened customers with specific needs
- ✅ **Low Cost**: Only $0.50 per lead unlock
- ✅ **Business Growth**: Expand to new suburbs and trade types
- ✅ **Performance Tracking**: Monitor ratings and job success rates

### For Platform
- ✅ **Scalable Architecture**: Built on Firebase for global scale
- ✅ **Real-time Updates**: Live notifications and status updates
- ✅ **Analytics**: Comprehensive business intelligence and reporting
- ✅ **Multi-platform**: Single codebase for iOS, Android, and Web

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Wiki](link-to-wiki)
- **Issues**: [GitHub Issues](link-to-issues)
- **Discussions**: [GitHub Discussions](link-to-discussions)
- **Email**: support@tradieapp.com

## 🙏 Acknowledgments

- **Expo Team** - For the amazing React Native platform
- **Firebase Team** - For the robust backend infrastructure
- **React Navigation** - For the navigation solution
- **Tailwind CSS** - For the utility-first CSS framework

---

**Built with ❤️ for the tradie community**

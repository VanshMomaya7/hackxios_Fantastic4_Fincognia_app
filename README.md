# PaisaBuddy - Financial Coach for Gig Workers

PaisaBuddy is an intelligent financial management app designed specifically for gig workers in India. It helps users track income, manage expenses, forecast cashflow, get tax assistance, and receive personalized financial advice through an AI-powered agent.

## Features

### 💰 Money Weather
- **Cashflow Forecasting**: Predict your balance for 7/30/90 days ahead
- **Cash Burn Simulator**: See how long your money will last based on spending patterns
- **Emergency Buffer Tracking**: Monitor and manage your safety net
- **Subscription Management**: Track and manage recurring payments
- **Event Anticipation**: Get alerts for upcoming big expenses

### 🤖 PaisaBuddy Agent
- **AI-Powered Financial Assistant**: Get instant answers to financial questions
- **Smart Insights**: Understand your spending patterns and income trends
- **Purchase Decisions**: Quick verdict on whether you can afford a purchase
- **Tax Help**: Get guidance on ITR filing and tax planning
- **Policy Advice**: Receive insurance recommendations based on your profile

### 📄 Document Assistant
- **Document Understanding**: Upload financial documents and get explanations in simple language
- **Policy Advisor**: Compare insurance policies and get personalized recommendations
- **ITR Filing Assistant**: Auto-generate your tax draft from payout screenshots and documents

### 📊 Adaptive Budgeting
- **Auto-Generated Budgets**: Intelligent budgets based on your income and expenses
- **Spend Velocity Monitoring**: Track spending pace and get alerts
- **Safety Buffer Enforcement**: Automatic savings recommendations
- **Budget Modes**: Survival, Normal, and Growth modes
- **Goal Tracking**: Set and achieve financial goals

### 🔒 Social Security / e-Shram
- **Labour Law Education**: Learn about your rights as a gig worker
- **Mock e-Shram Registration**: Practice registration with auto-filled forms
- **Benefits Summary**: Understand available social security benefits

### ⚡ Quick Tools
- **Split-Second Spending Verdict**: Instant AI-powered purchase decision tool
- **Transaction Management**: Track all income and expenses
- **Credit Score Tracking**: Monitor your credit health
- **Fraud Awareness Quiz**: Learn to identify and prevent financial fraud

## Tech Stack

### Frontend
- **React Native** 0.82.1 (TypeScript)
- **React Navigation** (Stack + Bottom Tabs)
- **Firebase** (Authentication, Firestore)
- **Zustand** (State Management)
- **React Native Vector Icons**
- **React Native Chart Kit**

### Backend
- **Node.js** + **Express**
- **Google Gemini AI** (Multimodal analysis, document understanding, agent responses)
- **Firebase Admin SDK** (Server-side Firestore access)
- **PDFKit** (Document generation)
- **Nodemailer** (Email delivery)

## Project Structure

```
FincogniaApp/
├── src/
│   ├── screens/          # Screen components
│   ├── components/       # Reusable UI components
│   ├── services/         # API and service layer
│   ├── navigation/       # Navigation setup
│   ├── store/            # Zustand state management
│   ├── types/            # TypeScript type definitions
│   ├── constants/        # Design tokens and constants
│   └── icons/            # App icons and assets
├── android/              # Android native code
├── ios/                  # iOS native code
└── ...

backend/
├── server.js             # Express server
├── services/             # Business logic services
├── utils/                # Utilities (PDF, email, etc.)
└── config/               # Configuration files
```

## Setup Instructions

### Prerequisites
- Node.js >= 20
- Android Studio (for Android development)
- Java Development Kit (JDK)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/VanshMomaya7/paisa-buddy-android-app-mumbai-hacks.git
   cd paisa-buddy-android-app-mumbai-hacks
   ```

2. **Install Frontend Dependencies**:
   ```bash
   cd FincogniaApp
   npm install
   ```

3. **Install Backend Dependencies**:
   ```bash
   cd ../backend
   npm install
   ```

4. **Configure Firebase**:
   - Follow instructions in `FincogniaApp/FIREBASE_SETUP.md`
   - Place `firebase-service-account.json` in `backend/config/`

5. **Configure Environment Variables**:
   - Create `.env` files as needed
   - Add Gemini API key, SMTP credentials, etc.

6. **Run the Backend**:
   ```bash
   cd backend
   node server.js
   ```

7. **Run the App**:
   ```bash
   cd FincogniaApp
   npm start
   # In another terminal
   npm run android
   ```

## Key Features Explained

### Money Weather
Uses transaction history and spending patterns to forecast future cashflow, helping gig workers prepare for lean periods.

### Adaptive Budgeting
Automatically generates budgets based on income volatility, spending patterns, and financial goals. Adjusts in real-time as circumstances change.

### Document Assistant
Uses Google Gemini AI to analyze financial documents (insurance policies, loan documents, payout summaries) and explain them in simple language.

### PaisaBuddy Agent
An AI financial coach that can:
- Explain spending patterns
- Help with purchase decisions
- Provide tax guidance
- Recommend insurance policies
- Answer financial questions

## Contributing

This project was built for Mumbai Hacks. Contributions are welcome!

## License

This project is part of the Mumbai Hacks hackathon submission.

## Authors

Built with ❤️ for gig workers in India


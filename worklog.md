---
Task ID: 1
Agent: Main Agent
Task: Download, extract and deploy Zarrin Gold project from user's tar file

Work Log:
- Downloaded 8.tar (81.9MB) from Google Drive using gdown
- Extracted tar file - identified as Zarrin Gold (زرین گلد) online gold trading platform
- Project includes: Next.js 16 frontend, Django REST backend, Prisma SQLite database
- Copied all project files to /home/z/my-project
- Installed 68 additional npm packages (tiptap, socket.io, etc.)
- Ran prisma db push to setup SQLite database (18 models)
- Fixed lint: only 6 warnings (alt-text), 0 errors
- Started dev server successfully - GET / 200

Stage Summary:
- Project running on port 3000
- Features: Landing page, Auth (OTP), Dashboard, Trade (buy/sell gold), Wallet, Transactions, Referral, Profile, Settings, Support, Admin panel
- RTL Persian UI with gold theme and dark/light mode
- Database: SQLite with 18 models (User, Profile, KYC, Wallet, GoldWallet, GoldPrice, Transaction, etc.)
- Django backend included but not running (mini-service)

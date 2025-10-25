# Invoice Generator with PDF Export

A professional web application for creating, managing, and exporting invoices as PDFs. Built with the MERN stack (MongoDB, Express.js, React, Node.js).

## Features

- 🔐 **JWT Authentication** - Secure user registration and login
- 📄 **Invoice Management** - Create, edit, delete, and view invoices
- 📊 **Dashboard** - Overview of invoice statistics and recent activity
- 🧾 **PDF Generation** - Server-side PDF generation with Puppeteer
- 📧 **Email Integration** - Send PDF invoices directly to clients
- 🔍 **Search & Filter** - Find invoices quickly with advanced filtering
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🎨 **Modern UI** - Clean, professional interface

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Puppeteer** for PDF generation
- **Nodemailer** for email functionality
- **Express Rate Limiting** for API protection

### Frontend
- **React 18** with functional components and hooks
- **React Router** for navigation
- **React Query** for server state management
- **React Hook Form** for form handling
- **Styled Components** for styling
- **React Hot Toast** for notifications

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd invoice-generator
```

### 2. Install dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Setup

#### Backend Environment Variables
Create a `.env` file in the `backend` directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/invoice-generator
# or for MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/invoice-generator

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Server
PORT=5002
NODE_ENV=development

# Email Configuration (for sending PDFs)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# PDF Generation
PDF_STORAGE_PATH=./generated-pdfs
cPDF_BASE_URL=http://localhost:5002/api/pdf/download
```

#### Frontend Environment Variables
Create a `.env` file in the `frontend` directory:

```env
REACT_APP_API_URL=http://localhost:5002/api
```

### 4. Database Setup
Make sure MongoDB is running locally or you have a MongoDB Atlas connection string.

### 5. Run the application

#### Development Mode
```bash
# From the root directory
npm run dev
```

This will start both the backend server (port 5002) and frontend development server (port 3000).

#### Production Mode
```bash
# Build frontend
npm run build

# Start backend
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - User logout

### Invoices
- `GET /api/invoices` - List invoices (with pagination and filters)
- `GET /api/invoices/:id` - Get single invoice
- `POST /api/invoices` - Create new invoice
- `PUT /api/invoices/:id` - Update invoice
- `PUT /api/invoices/:id/status` - Update invoice status
- `DELETE /api/invoices/:id` - Delete invoice
- `GET /api/invoices/search` - Search invoices
- `GET /api/invoices/stats` - Get invoice statistics

### PDF Generation
- `POST /api/pdf/:id/generate` - Generate PDF for invoice
- `GET /api/pdf/download/:filename` - Download PDF
- `GET /api/pdf/:id/info` - Get PDF information
- `DELETE /api/pdf/:id/delete` - Delete PDF
- `POST /api/pdf/:id/email` - Email PDF to client

## Project Structure

```
invoice-generator/
├── backend/
│   ├── config/          # Database and JWT configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── services/        # Business logic services
│   ├── templates/       # PDF templates
│   └── server.js        # Express server
├── frontend/
│   ├── public/          # Static files
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── contexts/    # React contexts
│   │   ├── hooks/       # Custom hooks
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── App.js       # Main App component
│   └── package.json
└── package.json
```

## Usage

### Creating an Invoice
1. Navigate to "New Invoice" from the dashboard
2. Fill in client information
3. Add line items with descriptions, quantities, and rates
4. Set tax rates and discounts
5. Add notes and terms if needed
6. Save as draft or mark as sent

### Generating PDFs
1. Open any invoice
2. Click "Generate PDF" button
3. Download the PDF or email it to the client

### Managing Invoices
- View all invoices in the invoices page
- Filter by status, date, or search by client name
- Edit invoices by clicking the edit button
- Delete invoices (with confirmation)
- Update invoice status (draft, sent, paid, cancelled)

## Features in Detail

### Invoice Management
- **Line Items**: Add multiple items with descriptions, quantities, rates, and tax
- **Calculations**: Automatic calculation of subtotals, taxes, discounts, and totals
- **Status Tracking**: Track invoice status from draft to paid
- **Client Management**: Store client information for reuse

### PDF Generation
- **Server-side Rendering**: High-quality PDFs generated with Puppeteer
- **Professional Layout**: Clean, printable invoice design
- **Customizable**: Company logo, branding, and styling
- **Multiple Formats**: A4 and Letter page sizes

### Security
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API protection against abuse
- **Input Validation**: Comprehensive data validation
- **CORS Protection**: Cross-origin request security

## Deployment

### Backend Deployment
1. Set up a MongoDB database (MongoDB Atlas recommended)
2. Configure environment variables
3. Deploy to platforms like Railway, Heroku, or DigitalOcean
4. Set up file storage for PDFs (AWS S3 recommended)

### Frontend Deployment
1. Build the React application: `npm run build`
2. Deploy to platforms like Vercel, Netlify, or AWS S3
3. Configure environment variables

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@invoicegenerator.com or create an issue in the repository.

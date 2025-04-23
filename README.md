# Digital Asset Management (DAM) App

A web application for managing and tagging photos, built with Next.js, Express.js, and MongoDB.

## Features

- 📁 Browse folder structure from your Synology NAS
- 🏷️ Tag photos individually or in bulk
- 🔍 Search photos by keywords
- 👥 Admin and Employee roles
- 🖼️ Thumbnail generation
- 🚀 Fast and responsive UI

## Prerequisites

- Node.js 18 or later
- MongoDB (local or cloud)
- Synology NAS with mounted directory

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
MONGODB_URI=your_mongodb_connection_string
PHOTOS_ROOT=/path/to/your/photos/directory
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd photos-didi
```

2. Install dependencies:
```bash
npm install
```

3. Build the application:
```bash
npm run build
```

4. Start the development server:
```bash
npm run dev
```

## Folder Synchronization

To sync your photo directory with the database:

```bash
npm run sync-folders
```

This will:
- Scan your photo directory recursively
- Create folder entries in MongoDB
- Generate thumbnails for images
- Update file metadata

## API Endpoints

### Folders
- `GET /api/folders` - Get folder tree
- `GET /api/folder?path=...` - List files in folder

### Search
- `GET /api/search?keyword=...` - Search files by keyword

### Keywords
- `POST /api/keywords/file` - Tag a single file
- `POST /api/keywords/folder` - Tag all files in a folder
- `GET /api/keywords/suggest?q=...` - Get keyword suggestions

### Images
- `GET /api/image?path=...` - Get original image
- `GET /api/thumbnail?path=...` - Get image thumbnail

## Development

The application is built with:

- Next.js 14 for the frontend
- Tailwind CSS for styling
- MongoDB for data storage
- Sharp for image processing

## Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

For Synology NAS deployment:
1. Install Node.js package on your NAS
2. Set up the application as a Node.js service
3. Configure environment variables
4. Start the service

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
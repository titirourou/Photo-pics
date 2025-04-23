const mongoose = require('mongoose');

const uri = "mongodb+srv://timrousseau:XYe4LDZinutqxsBF@pics-cts.rkfhi3f.mongodb.net/pics-cts?retryWrites=true&w=majority&appName=Pics-CTS";

// Define schemas
const folderSchema = new mongoose.Schema({
  name: String,
  path: String,
  parentPath: String,
  keywords: [String]
});

const fileSchema = new mongoose.Schema({
  filename: String,
  path: String,
  folderPath: String,
  size: Number,
  extension: String,
  keywords: [String],
  thumbnailPath: String
});

async function clearAllData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected successfully');

    // Get model references
    const Folder = mongoose.model('Folder', folderSchema);
    const File = mongoose.model('File', fileSchema);

    // Delete all documents from both collections
    console.log('Deleting all folders...');
    const foldersResult = await Folder.deleteMany({});
    console.log(`Deleted ${foldersResult.deletedCount} folders`);

    console.log('Deleting all files...');
    const filesResult = await File.deleteMany({});
    console.log(`Deleted ${filesResult.deletedCount} files`);

    // Verify collections are empty
    const remainingFolders = await Folder.countDocuments();
    const remainingFiles = await File.countDocuments();
    console.log('Remaining documents:', {
      folders: remainingFolders,
      files: remainingFiles
    });

    console.log('All data cleared successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

clearAllData(); 
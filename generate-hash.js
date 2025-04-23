const bcrypt = require('bcrypt');
const saltRounds = 10;

async function generateHash() {
    const adminPassword = 'admin123';
    const userPassword = 'user123';
    
    const adminHash = await bcrypt.hash(adminPassword, saltRounds);
    const userHash = await bcrypt.hash(userPassword, saltRounds);
    
    console.log('Admin Password Hash:', adminHash);
    console.log('User Access Code Hash:', userHash);
}

generateHash(); 
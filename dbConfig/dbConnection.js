const mongoose = require('mongoose')

const connectoDb = async () => {
    try{
        const db = await mongoose.connect('mongodb+srv://admin:admin@jwt.a0o8vji.mongodb.net/jwt?retryWrites=true&w=majority')
        console.log('database connection', db.connection.host, db.connection.name)
    }catch(err){
        console.log(err)
        process.exit(1)
    }
}

module.exports = connectoDb
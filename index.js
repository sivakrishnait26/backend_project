const express = require('express')
const dotenv = require('dotenv').config()
const {open} = require('sqlite')
const path = require('path')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const app = express()
const fs = require("fs");
app.use(cors())
app.use(express.json())
const db_path = path.join(__dirname, 'goodreads.db')
const PORT = process.env.PORT||5000
const SECRETE_TOKEN = process.env.SECRETE_TOKEN
let db = null;
const initializeDBAndServer = async()=> {
    try {
        db = await open({
        filename: db_path,
        driver: sqlite3.Database
    })
    app.listen(PORT, ()=> {
    console.log(`server listen at ${PORT}`)
    })
    }
    catch(e){
        console.log(`DBError: ${e.message}`)
        process.exit(1)
    }
    
}
initializeDBAndServer()

const authenticateToken = (req, res, next) => {
    let jwtToken;
    const authHeader = req.headers["authorization"];
    
    if(authHeader !== undefined){
        jwtToken = authHeader.split(" ")[1];
    }
    if(jwtToken === undefined) {
        res.status(401);
        res.send("Invalid jwtToken");
    }
    else {
        jwt.verify(jwtToken, SECRETE_TOKEN, async(error, payload)=>{
            if(error) {
                res.status(401);
                res.send("Invalid Access Token");
            }
            else {

                req.username = payload.username;
                next();

            }
        })
        
    }
}

app.get('/books/',authenticateToken, async(req, res)=>{
    const {search_q, limit, offset} = req.query;
    const getBooksQuery = `select * from books where bookname like '%${search_q}%' limit ${limit} offset ${offset};`;
    const booksArray = await db.all(getBooksQuery);
    res.send(booksArray); 
})

app.get('/books/:bookId', authenticateToken, async(req, res)=>{
    const {bookId} = req.params
    const getBookQuery = `select * from books where bookId='${bookId}';`;
    const getbook = await db.get(getBookQuery)
    res.send(getbook)
})

app.post('/books/', authenticateToken, async(req, res)=>{
    const bookInfo = req.body
    const {bookname, authorId, bookdetails} = bookInfo
    const addBookQuery = `
  INSERT INTO books(bookname, authorId, bookdetails)
  VALUES(?, ?, ?);
`;
    const dbResponse = await db.run(addBookQuery, [bookname, authorId, bookdetails])
    const bookId = dbResponse.lastID
    
    res.send({bookId: bookId});
})

app.delete('/books/:bookId/', authenticateToken, async(req, res)=>{
    const {bookId} = req.params;
    const deleteBookQuery = `delete from books where bookId = '${bookId}';`;
    await db.run(deleteBookQuery)
    
    res.send("book deleted successfully");
})


app.get('/authors/:authorId/books/:bookId/', authenticateToken, async(req, res)=>{
    const {authorId} = req.params
    const getBookQuery = `select * from books where authorId= ?`;
    const getbook = await db.get(getBookQuery, [authorId])
    res.send(getbook)
})

//create user API

app.post('/users/', async(req, res) =>{
    const {username, password, gender, location} = req.body;
    const slatRounds = 10;
    const hashedPassword = await bcrypt.hash(password, slatRounds);
    const selectUserQuery = `select * from users where username = '${username}';`;
    const dbUser = await db.get(selectUserQuery);

    if(dbUser === undefined) {
        const createUserQuery = `insert into users(username, password, gender, location) values ('${username}', '${hashedPassword}', '${gender}', '${location}');`;
        await db.run(createUserQuery);
        res.send("User created successfully");

    }else{

        res.status(400);
        res.send("User already exists");
    }
})

//get user

app.post("/login/", async(req, res) => {
    const {username, password} = req.body;
    const selectUserQuery = `select * from users where username = '${username}';`;
    const dbUser = await db.get(selectUserQuery);

    if(dbUser === undefined){
        res.status(400);
        res.send("Invalid username/password");
    }
    else {
        const isPasswordMatch = await bcrypt.compare(password, dbUser.password);

        if(isPasswordMatch === true){
            const payload = {username: username}
            const jwtToken = jwt.sign(payload, SECRETE_TOKEN);
            
            fs.writeFileSync("token.txt", jwtToken);

            console.log(jwtToken);
            res.send({jwtToken});
            
        }
        else {
            res.status(400);
            res.send("Invalid username/password");
        }
    }

})

app.get('/profile/', authenticateToken, async (req, res) => {
    const {username} = req;
    console.log(username);
    const selectUserQuery = `select * from users where username = '${username}';`;
    const dbUser = await db.get(selectUserQuery);
    res.send(dbUser);
})
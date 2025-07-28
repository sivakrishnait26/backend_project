const express = require('express')
const {open} = require('sqlite')
const path = require('path')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const app = express()
app.use(express.json())
const db_path = path.join(__dirname, 'goodreads.db')
let db = null;
const initializeDBAndServer = async()=> {
    try {
        db = await open({
        filename: db_path,
        driver: sqlite3.Database
    })
    app.listen(5000, ()=> {
    console.log("server listen at http://localhost:5000/")
    })
    }
    catch(e){
        console.log(`DBError: ${e.message}`)
        process.exit(1)
    }
    
}
initializeDBAndServer()

app.get('/books/', async(req, res)=>{
    const getBooksQuery = `select * from books order by bookId;`;
    const booksArray = await db.all(getBooksQuery)
    res.send(booksArray)
})

app.get('/books/:bookId', async(req, res)=>{
    const {bookId} = req.params
    const getBookQuery = `select * from books where bookId='${bookId}';`;
    const getbook = await db.get(getBookQuery)
    res.send(getbook)
})

app.post('/books/', async(req, res)=>{
    const bookInfo = req.body
    const {bookname, authorId, bookdetails} = bookInfo
    const addBookQuery = `
  INSERT INTO books(bookname, authorId, bookdetails)
  VALUES('${bookname}', '${authorId}', '${bookdetails}');
`;
    const dbResponse = await db.run(addBookQuery)
    const bookId = dbResponse.lastID
    
    res.send({bookId: bookId});
})

app.delete('/books/:bookId/', async(req, res)=>{
    const {bookId} = req.params;
    const deleteBookQuery = `delete from books where bookId = '${bookId}';`;
    await db.run(deleteBookQuery)
    
    res.send("book deleted successfully");
})

app.put('/books/:bookId/', async(req, res)=>{
    const {bookId} = req.params;
    
   
    const updateBookQuery = `update books 
    set bookname = ${bookname}, authorId = ${authorId}, bookdetails = ${bookdetails}
    where bookId = '${bookId}';`;
    await db.run(updateBookQuery)
    
    res.send("book updated successfully");
})

app.get('/authors/:authorId/books/:bookId/', async(req, res)=>{
    const {authorId} = req.params
    const getBookQuery = `select * from books where authorId='${authorId}';`;
    const getbook = await db.get(getBookQuery)
    res.send(getbook)
})

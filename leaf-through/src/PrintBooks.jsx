import React, { useState } from 'react';

const PrintBooks = ({ books = ([]), usrBooks = ([]), readLater = ([]), deleteBook, notes, handleAddOrEditNote, updateBookStatus }) => {
    const [removingBookId, setRemovingBookId] = useState(null);

    const handleDelete = (id) => {
        setRemovingBookId(id);
        setTimeout(() => {
            deleteBook(id);
            setRemovingBookId(null);
        }, 150);
    };

    const handleDeleteAll = () => {
        combinedBooks.forEach((book, index) => {
            setTimeout(() => {
                handleDelete(book.id);
            }, index * 150);
        });
    };

    const combinedBooks = [...books, ...usrBooks, ...readLater]
    const temp = combinedBooks.map((book) => (
        <li key={book.id} className={`book-item ${removingBookId === book.id ? 'removing' : 'all'}`} >
            {book.cover && (
                <img src={book.cover} alt={book.title} />
            )}
            <strong><a href={book.link} target='_blank' rel="noopener noreferrer">{book.title}</a></strong>
            {book.authors && (
                <em> by {book.authors.join(', ')} </em>
            )}
            <select
                value={book.status}
                onChange={(e) => updateBookStatus(book.id, e.target.value)}
            >
                <option value="Not Started">Not Started</option>
                <option value="Currently Reading">Currently Reading</option>
                <option value="Finished Reading">Finished Reading</option>
            </select>
            {book.status === "Finished Reading" && <span className="finished-icon">✔️</span>}
            <button className="note-button" onClick={() => handleAddOrEditNote(book.id)}>{notes[book.id] ? "Edit Note" : "Add Note"}</button>
            <button className='delete-button' onClick={() => handleDelete(book.id)}>
                ❌
            </button>
        </li>
    ))

    return (
        <>
            <ul>{temp}</ul>
            {temp.length > 1 && <button
                className={'remove-all'}
                onClick={handleDeleteAll}
            >
                🧹 Clear All
            </button>}
        </>
    )
}

export default PrintBooks;

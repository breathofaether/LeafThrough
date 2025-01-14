import React, { useState, useEffect, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import noThumbnail from "./images/no_cover.jpg";
import { quotes } from './quotes/quotes';
import { collection, doc, setDoc, deleteDoc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "./backend/firebase";
import PrintBooks from './PrintBooks';
import confetti from "canvas-confetti";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  getAuth,
  deleteUser
} from "firebase/auth";
import { auth } from "./backend/firebase";
import AuthForm from './backend/AuthForm';

function App() {
  const [books, setBooks] = useState([])
  const [usrEnteredBooks, setUsrEnteredBooks] = useState([]);
  const [readLater, setReadLater] = useState([]);
  const [notes, setNotes] = useState([])

  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem('theme');
    return storedTheme || 'light';
  });

  const [userId, setUserIdState] = useState(null);
  const [editingBookId, setEditingBookId] = useState(null);
  const [currentNote, setCurrentNote] = useState("")
  const [nextReads, setNextReads] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [holdBooks, setHoldBooks] = useState([]);
  const [pick, setPick] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [modalVisible, setModalVisible] = useState(false)
  const [suggestionVisible, setSuggestionVisible] = useState(false)
  const [addBookId, setAddBookId] = useState(null)
  const scrollContainerRef = useRef(null);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showAddToShelfModal, setShowAddToShelfModal] = useState(false);
  const [favoriteFilterStatus, setFavoriteFilterStatus] = useState("All");
  const [bookshelfFilterStatus, setBookshelfFilterStatus] = useState("All");

  const API_KEY = import.meta.env.VITE_API_KEY;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserIdState(user.uid);
        localStorage.setItem("userId", user.uid);
      } else {
        setUserIdState(null);
        localStorage.removeItem("userId");
        toast.info("You're not logged in. Your data will be lost on refresh. Login to save books permanently");
      }
    });

    return () => unsubscribe();
  }, []);



  useEffect(() => {
    if (!userId) return;

    const fetchBooks = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users", userId, "books"));
        const booksFromFirestore = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setBooks(booksFromFirestore);
      } catch (error) {
        console.error("Error fetching books: ", error);
      }
    };
    if (userId) fetchBooks();
  }, [userId]);


  useEffect(() => {
    if (!userId) return;

    const fetchReadLaterBooks = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users", userId, "readLater"));
        const booksFromFirestore = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setReadLater(booksFromFirestore);
      } catch (error) {
        console.error("Error fetching books: ", error);
      }
    };
    if (userId) fetchReadLaterBooks();
  }, [userId]);


  useEffect(() => {
    if (!userId) return;

    const fetchUsrEnteredBooks = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users", userId, "usrEnteredBooks"));
        const booksFromFirestore = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setUsrEnteredBooks(booksFromFirestore);
      } catch (error) {
        console.error("Error fetching books: ", error);
      }
    };
    if (userId) fetchUsrEnteredBooks();
  }, [userId]);


  useEffect(() => {
    if (!userId) return;

    const fetchNotes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users", userId, "notes"));
        const notesFromFirestore = {};
        querySnapshot.forEach((doc) => {
          notesFromFirestore[doc.id] = doc.data().note;
        });
        setNotes(notesFromFirestore);
      } catch (error) {
        console.error("Error fetching notes: ", error);
      }
    };
    if (userId) fetchNotes();
  }, [userId]);


  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme])

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length)
    }, 600000)
    return () => clearInterval(quoteInterval);
  }, [])

  useEffect(() => {
    const lastLogin = localStorage.getItem("guestCreatedAt");
    if (!lastLogin) {
      localStorage.setItem("guestCreatedAt", Date.now());
    } else {
      const timeElapsed = Date.now() - parseInt(lastLogin, 10);
      if (timeElapsed > 24 * 60 * 60 * 1000) {
        localStorage.removeItem("guestId");
        localStorage.removeItem("guestCreatedAt");
        setUserIdState(null);
        toast.info("Your guest session has expired.");
      }
    }
  }, []);


  const signUpWithEmail = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      setUserIdState(user.uid);
      localStorage.setItem("userId", user.uid);
      toast.success("Account created successfully!");
      toast.info("Please remember your password, as there is no way to recover it.");
    } catch (error) {
      console.error("Error signing up:", error);
      toast.error("Error Signing Up. Please try again.");
    }
  };

  const signInWithEmail = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      setUserIdState(user.uid);
      localStorage.setItem("userId", user.uid);
      toast.success("Successfully signed in!");
    } catch (error) {
      toast.error("Login failed. Please try again");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserIdState(null);
      setBooks([])
      setReadLater([])
      setUsrEnteredBooks([])
      setNotes([])
      localStorage.removeItem("userId");
      toast.info("You have logged out.");
    } catch (error) {
      toast.error("Failed to log out.");
    }
  };

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }


  const fetchSuggestions = async (query) => {
    if (query.trim() === "") {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${query}&key=${API_KEY}`
      );

      const data = await response.json();

      if (data.items) {
        setSuggestions(
          data.items.map((item) => ({
            id: item.id,
            title: item.volumeInfo.title || "Unknown Title",
            cover: item.volumeInfo.imageLinks?.thumbnail || null,
            authors: item.volumeInfo.authors || null,
            genre: item.volumeInfo.mainCategory || "Unknown",
            link: item.volumeInfo.infoLink || "#",
            status: "Not Started"
          }))
        );
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  }

  const debouncedFetchSuggestions = debounce(fetchSuggestions, 300);

  const discoverBooks = async () => {

    const queryString = "subject:fiction+nonfiction";
    const startIndex = Math.floor(Math.random() * 100);

    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${queryString}&startIndex=${startIndex}&maxResults=9&key=${API_KEY}`)
    const data = await response.json();

    if (data.items) {
      setHoldBooks(data.items.map(item => ({
        id: item.id,
        title: item.volumeInfo.title,
        authors: item.volumeInfo.authors || ["Unknown Author"],
        cover: item.volumeInfo.imageLinks ? item.volumeInfo.imageLinks.thumbnail : noThumbnail,
        genre: item.volumeInfo.mainCategory || "Unknown",
        link: item.volumeInfo.infoLink || "#",
        status: "Not Started"
      })));
    }
  }


  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    let scrollInterval;

    const startAutoScroll = () => {
      scrollInterval = setInterval(() => {
        if (scrollContainer) {
          scrollContainer.scrollLeft += 1;

          const maxScrollLeft = scrollContainer.scrollWidth / 2;
          if (scrollContainer.scrollLeft >= maxScrollLeft) {
            scrollContainer.scrollLeft = 0;
          }
        }
      }, 10);
    };

    const stopAutoScroll = () => {
      clearInterval(scrollInterval);
    };

    if (scrollContainer) {
      startAutoScroll();
    }

    return () => {
      stopAutoScroll();
    };
  }, []);


  const refresh = () => {
    setHoldBooks([]);
    discoverBooks();
  }

  useEffect(() => {
    discoverBooks();
  }, [])



  const addBook = async (book) => {
    if (!userId) {
      setSuggestions([])
      setSearchInput("");
      setBooks((prevBooks) => [...prevBooks, book]);
      toast.info("Please log in to save books permanently.");
      return;
    }

    try {
      if (!books.some(existingBook => existingBook.id === book.id)) {
        const bookDoc = doc(collection(db, "users", userId, "books"), book.id);
        await setDoc(bookDoc, book);
        setSuggestions([])
        setSearchInput("");
        setBooks((prevBooks) => [...prevBooks, book]);
        toast.success(`${book.title} has been added to your Favorites list.`);
      } else {
        toast.error(`${book.title} is already in your list`);
      }
    } catch (error) {
      console.error("Error adding book: ", error);
      toast.error("Error adding book. Please try again.");
    }
  };


  const addBookToReadLater = async (book) => {
    if (!userId) {
      setReadLater((prevBooks) => [...prevBooks, book]);
      setSuggestions([])
      setSearchInput("");
      setSuggestionVisible(false)
      toast.info("Please log in to save books permanently.");
      return;
    }

    try {
      if (!readLater.some(existingBook => existingBook.id === book.id)) {
        const bookDoc = doc(collection(db, "users", userId, "readLater"), book.id);
        await setDoc(bookDoc, book);
        setReadLater((prevBooks) => [...prevBooks, book]);
        setSuggestions([])
        setSearchInput("");
        setSuggestionVisible(false)
        toast.success(`${book.title} has been added to your Bookshelf!`);
      } else {
        toast.error(`${book.title} is already in your list`);
      }

    } catch (error) {
      console.error("Error adding book: ", error);
      toast.error("Error adding book. Please try again.");
    }
  }

  const handleSubmit = async (event) => {
    if (!userId) {
      toast.info("Please log in to save books permanently.");
    }

    event.preventDefault();

    const title = event.target.title.value;
    const authors = event.target.authors.value.split(',').map(author => author.trim());
    const link = event.target.link.value;
    const genre = event.target.genre.value;

    const book = {
      id: Date.now(),
      title: title || "N/A",
      authors: authors || ["Unknown Author"],
      cover: noThumbnail,
      genre: genre || "Unknown",
      link: link || "#",
      status: "Not started"
    }

    try {
      if (!usrEnteredBooks.some(existingBook => existingBook.id === book.id)) {
        const bookDoc = doc(collection(db, "usrEnteredBooks"), book.id)
        await setDoc(bookDoc, book)
        setUsrEnteredBooks([...usrEnteredBooks, book]);
        setShowForm(false);
        toast.success(`${book.title} has been added to your Favorites list.`);
      } else {
        toast.error(`${book.title} is already in your list`);
      }

    } catch (error) {
      console.error("Error adding book: ", error);
      toast.error("Error adding book. Please try again.");
    }

  }

  const pickABook = (typeOfBook, secondTypeOfBook = []) => {
    const combinedBooks = [...typeOfBook, ...secondTypeOfBook];

    if (combinedBooks.length === 0) {
      setPick(null);
      setModalVisible(true);
      return;
    } else {
      const randomIndex = Math.floor(Math.random() * combinedBooks.length);
      const randomBook = combinedBooks[randomIndex];
      setPick(randomBook);
      return setModalVisible(true);
    }
  }




  const BookModal = ({ book, onClose }) => {
    return (
      <div className='modal'>
        <button className='modal-close' onClick={onClose}>X</button>
        {book === null ? (
          <p>No books added yet! Add some books to pick from.</p>
        ) : (
          <>
            {book.cover && <img src={book.cover} alt={`${book.title} cover`} />}
            <h2><a href={book.link} target='_blank' rel="noopener noreferrer">{book.title}</a></h2>
            <p>Rediscover this book and enjoy your reading journey!</p>
          </>
        )}
      </div>
    )
  }

  const AddToShelf = ({ book, onClose }) => {
    const handleAddToFavorites = () => {
      addBook(book);
      setShowAddToShelfModal(false);
    };

    const handleAddToReadLater = () => {
      addBookToReadLater(book);
      setShowAddToShelfModal(false);
    };

    return (
      <div className="modal">
        <div className="modal-content">
          <h3>Add "{book.title}" to:</h3>
          <button onClick={handleAddToFavorites}>❤️ Add to Favorites</button>
          <button onClick={handleAddToReadLater}>🔜 Add to Bookshelf</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    );
  };



  const Suggest = ({ book, onClose, onAddToReadLater }) => {
    return (
      <div className='suggest'>
        <button className='suggest-close' onClick={onClose}>X</button>
        <>
          {book.cover && <img src={book.cover} alt={`${book.title} cover`} />}
          <h2><a href={book.link} target='_blank' rel="noopener noreferrer">{book.title}</a></h2>
          <strong>by {book.authors}</strong>
          <p>Discover this book and enjoy your reading journey!</p>
          <button className='add-to-read-later' onClick={() => onAddToReadLater(book)}>
            +
          </button>
        </>
      </div>
    )
  }

  const handleSuggestionOpen = (book) => {
    setNextReads(book);
    setSuggestionVisible(true);
  }

  const handleCloseSuggestion = () => {
    setSuggestionVisible(false)
  }

  const deleteBook = async (id) => {
    if (!userId) {
      setBooks((prevBooks) => prevBooks.filter((book) => book.id !== id));
      setUsrEnteredBooks((prevBooks) => prevBooks.filter((book) => book.id !== id));
      setReadLater((prevBooks) => prevBooks.filter((book) => book.id !== id));
      setNotes((prevNotes) => {
        const { [id]: _, ...remainingNotes } = prevNotes;
        return remainingNotes;
      });
      return;
    }

    try {
      const bookDoc = doc(db, "users", userId, "books", id);
      await deleteDoc(bookDoc);
      setBooks((prevBooks) => prevBooks.filter((book) => book.id !== id));

      const usrBookDoc = doc(db, "users", userId, "usrEnteredBooks", id);
      await deleteDoc(usrBookDoc);
      setUsrEnteredBooks((prevBooks) => prevBooks.filter((book) => book.id !== id));

      const readLaterDoc = doc(db, "users", userId, "readLater", id);
      await deleteDoc(readLaterDoc);
      setReadLater((prevBooks) => prevBooks.filter((book) => book.id !== id));
      toast.success("Book deleted successfully!");

      const noteDoc = doc(db, "users", userId, "notes", id);
      await deleteDoc(noteDoc);
      setNotes((prevNotes) => {
        const { [id]: _, ...remainingNotes } = prevNotes;
        return remainingNotes;
      });
    } catch (error) {
      console.error("Error deleting book: ", error);
      toast.error("Error deleting book. Please try again.");
    }
  };

  const handleSaveNote = async () => {

    if (!userId) {
      setNotes((prevNotes) => ({
        ...prevNotes,
        [editingBookId]: currentNote,
      }));
      return;
    }

    try {
      const bookDoc = doc(db, "users", userId, "notes", editingBookId);
      await setDoc(bookDoc, { note: currentNote }, { merge: true });

      setNotes((prevNotes) => ({
        ...prevNotes,
        [editingBookId]: currentNote,
      }));

      toast.success("Note saved!");
      setEditingBookId(null);
      setCurrentNote("");
    } catch (error) {
      console.error("Error adding note: ", error);
      toast.error("Error adding note. Please try again.");
    }
  };


  const handleShelf = (book) => {
    setSelectedBook(book);
    setShowAddToShelfModal(true)
  }

  const updateBookStatus = async (bookId, newStatus) => {
    if (!userId) {
      toast.info("Login to update status.")
      return
    }
    try {
      let bookFoundIn = null;

      const bookIndex = books.findIndex((book) => book.id === bookId);
      if (bookIndex !== -1) {
        const bookDoc = doc(db, "users", userId, "books", bookId);
        await updateDoc(bookDoc, { status: newStatus }, { merge: true });

        setBooks((prevBooks) =>
          prevBooks.map((book) =>
            book.id === bookId ? { ...book, status: newStatus } : book
          )
        );
        bookFoundIn = "Favorites";
      }

      const readLaterIndex = readLater.findIndex((book) => book.id === bookId);
      if (readLaterIndex !== -1) {
        const readLaterDoc = doc(db, "users", userId, "readLater", bookId);
        await updateDoc(readLaterDoc, { status: newStatus }, { merge: true });

        setReadLater((prevBooks) =>
          prevBooks.map((book) =>
            book.id === bookId ? { ...book, status: newStatus } : book
          )
        );
        bookFoundIn = "Bookshelf";
      }

      if (bookFoundIn) {
        toast.success(`Status updated to ${newStatus} in ${bookFoundIn}!`);
      } else {
        toast.error("Book not found in any list.");
      }

      if (newStatus === "Finished Reading") {
        confetti({
          particleCount: 100,
          spread: 90,
          origin: { y: 0.6 },
        });
      }
    } catch (error) {
      console.error("Error updating status: ", error);
      toast.error("Error updating status. Please try again.");
    }
  };


  const handleAddBook = (book) => {
    setAddBookId(book.id);
    setTimeout(() => {
      addBook(book);
      setAddBookId(null);
    }, 150);
  }

  const handleThemeSwitch = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"))
  }

  const handleAddOrEditNote = (bookId) => {
    setEditingBookId(bookId)
    setCurrentNote(notes[bookId] || "")
  }


  const handleCancelEdit = () => {
    setEditingBookId(null)
    setCurrentNote("")
  }

  const filterBooks = (bookList, status) => {
    return bookList.filter(
      (book) => status === "All" || book.status === status
    );
  };

  const FilterSection = ({ filterStatus, setFilterStatus }) => {
    return (
      <div className='filter-section'>
        <label htmlFor='statusFilter'>Filter by Status: </label>
        <select
          id='statusFilter'
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="All">All</option>
          <option value="Not Started">Not Started</option>
          <option value="Currently Reading">Currently Reading</option>
          <option value="Finished Reading">Finished Reading</option>
        </select>
      </div>
    );
  };


  const deleteUserData = async (userId) => {
    try {
      const userCollections = ["books", "notes", "usrEnteredBooks", "readLater"]; // List of collections

      for (const collectionName of userCollections) {
        const collectionRef = collection(db, "users", userId, collectionName);
        const querySnapshot = await getDocs(collectionRef);

        const deletePromises = querySnapshot.docs.map((docSnapshot) =>
          deleteDoc(doc(db, "users", userId, collectionName, docSnapshot.id))
        );

        await Promise.all(deletePromises);
      }

      await deleteDoc(doc(db, "users", userId));

      toast.success("Your account and data have been deleted.");
    } catch (error) {
      console.error("Error deleting user data: ", error);
      toast.error("Failed to delete user data. Try again later.");
    }
  };

  const handleDeleteAccount = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      toast.error("No user logged in.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteUserData(user.uid);

      await deleteUser(user);

      toast.success("Account successfully deleted.");
    } catch (error) {
      console.error("Error deleting account: ", error);
      toast.error("Failed to delete account. Try logging in again and retry.");
    }
  };


  return (
    <div>
      <h2 className='title' onClick={() => pickABook(books, usrEnteredBooks)}>LeafThrough</h2>
      <h3 className="quote">{quotes[currentQuoteIndex]}</h3>
      <strong className="instruction-text">
        Add your favorite books to the collection using the search bar or manual entry in the 'Add to Favorites' section.
        When you're ready, click the BookBuddy logo for a surprise pick!
        Explore interesting reads in the 'Discover' section to find books you might love.
      </strong>

      <div className='authentication'>
        {!userId ? (
          <div className='login'>
            <AuthForm onSignUp={signUpWithEmail} onSignIn={signInWithEmail} />
          </div>
        ) : (
          <div>
            <button className='logout' onClick={handleLogout}>Logout</button>
            <button className="delete-account-btn" onClick={handleDeleteAccount}>
              Delete Account
            </button>
          </div>
        )}
      </div>

      <div className='discover-books'>
        <h2>Discover</h2>
        <div className='primary-scroll' ref={scrollContainerRef}>
          {holdBooks.map(book => (
            <div className="secondary-scroll" key={book.id} onClick={() => handleSuggestionOpen(book)}>
              <img src={book.cover || noThumbnail} alt={book.title} />
            </div>
          ))}
          {holdBooks.map(book => (
            <div className="secondary-scroll" key={book.id + 'clone'} onClick={() => handleSuggestionOpen(book)}>
              <img src={book.cover || noThumbnail} alt={book.title} />
            </div>
          ))}
        </div>
        <button className='refresh' onClick={refresh}>🔄</button>
        {suggestionVisible && nextReads && (<Suggest book={nextReads} onClose={handleCloseSuggestion} onAddToReadLater={addBookToReadLater} />)}
      </div>

      <h2>Add to favorites</h2>
      <div className='search-books'>
        <input
          type='text'
          placeholder='Enter book name...'
          value={searchInput}
          onChange={(e) => {
            const value = e.target.value;
            setSearchInput(value);
            debouncedFetchSuggestions(value)
          }}
        />
        <div className={`suggestion-list ${suggestions.length > 0 ? "visible" : ""}`}>
          <ul>
            {suggestions.map((suggestion) => (
              <li key={suggestion.id} className={`add-item ${addBookId === suggestion.id ? 'adding' : ''}`} onClick={() => handleShelf(suggestion)}>
                {suggestion.title}
                {suggestion.authors && <em> by ({suggestion.authors.join(', ')})</em>}
              </li>
            ))}
          </ul>
        </div>

        <div className='manual-entry'>
          <em>Can't find the book you're looking for? Add it manually<br /></em>
          <button onClick={() => setShowForm(!showForm)}>Add here</button>
          {showForm && (
            <form onSubmit={handleSubmit}>
              <input
                name="title"
                type='text'
                placeholder='Enter title'
                required
              />
              <input
                name='authors'
                type='text'
                placeholder='Enter authors, separated by commas'
                required
              />
              <input
                name='genre'
                type='text'
                placeholder='Enter genre'
                required
              />
              <input
                name='link'
                type='url'
                placeholder='Optional: Enter a link to learn more about this book'
              />
              <button className='submit' type='submit'>Submit</button>
            </form>
          )}
        </div>
      </div>


      <div className='books-list'>
        <h2>✨ Rediscover your favorite books</h2>
        {(books.length === 0 && usrEnteredBooks.length === 0) && <p className='instruction-text'>No books added yet. Start by adding a book</p>}
        <FilterSection filterStatus={favoriteFilterStatus} setFilterStatus={setFavoriteFilterStatus} />
        <PrintBooks books={filterBooks(books, favoriteFilterStatus)} usrBooks={filterBooks(usrEnteredBooks, favoriteFilterStatus)} deleteBook={deleteBook} notes={notes} handleAddOrEditNote={handleAddOrEditNote} updateBookStatus={updateBookStatus} />
        {editingBookId && (
          <div className='note-drawer'>
            <h3>{books.find(book => book.id === editingBookId)?.title}</h3>
            <textarea
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              placeholder='Enter your note here'
            />
            <button className="note-button" onClick={handleSaveNote}>Save</button>
            <button className="note-button" onClick={handleCancelEdit}>Cancel</button>
          </div>
        )}
      </div>

      <div className='books-list'>
        <h2>Bookshelf 🏛️</h2>
        {(readLater.length === 0) && <p className='instruction-text'>No books added yet. Start by adding a book</p>}
        <FilterSection filterStatus={bookshelfFilterStatus} setFilterStatus={setBookshelfFilterStatus} />
        <PrintBooks readLater={filterBooks(readLater, bookshelfFilterStatus)} deleteBook={deleteBook} notes={notes} handleAddOrEditNote={handleAddOrEditNote} updateBookStatus={updateBookStatus} />
      </div>

      <button className='switch-theme' onClick={handleThemeSwitch}>{theme === "light" ? "🌙" : "☀️"}</button>

      {modalVisible && <BookModal book={pick} onClose={() => setModalVisible(false)} />}

      <ToastContainer />

      {showAddToShelfModal && selectedBook && (
        <AddToShelf
          book={selectedBook}
          onClose={() => setShowAddToShelfModal(false)}
        />
      )}
    </div>
  );
}

export default App;
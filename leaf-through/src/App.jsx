import React, { useState, useEffect, useRef } from 'react';
import noThumbnail from "./images/no_cover.jpg";

const PrintBooks = ({ books = ([]), usrBooks = ([]), deleteBook }) => {
  const [removingBookId, setRemovingBookId] = useState(null);


  const handleDelete = (id) => {
    setRemovingBookId(id);
    setTimeout(() => {
      deleteBook(id);
      setRemovingBookId(null);
    }, 300);
  };

  const handleDeleteAll = () => {
    combinedBooks.forEach((book, index) => {
      setTimeout(() => {
        handleDelete(book.id);
      }, index * 150);
    });
  };

  const combinedBooks = [...books, ...usrBooks]
  const temp = combinedBooks.map((book) => (
    <li key={book.id} className={`book-item ${removingBookId === book.id ? 'removing' : 'all'}`} >
      {book.cover && (
        <img src={book.cover} alt={book.title} />
      )}
      <strong><a href={book.link} target='_blank' rel="noopener noreferrer">{book.title}</a></strong>
      {book.authors && (
        <em> by {book.authors.join(', ')} </em>
      )}
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

function App() {
  const [books, setBooks] = useState(() => {
    const storedBooks = localStorage.getItem('books');
    return storedBooks ? JSON.parse(storedBooks) : [];
  });
  const [usrEnteredBooks, setUsrEnteredBooks] = useState(() => {
    const storedUsrEnteredBooks = localStorage.getItem('usrEnteredBooks');
    return storedUsrEnteredBooks ? JSON.parse(storedUsrEnteredBooks) : [];
  });
  const [nextReads, setNextReads] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [holdBooks, setHoldBooks] = useState([]);
  const [pick, setPick] = useState(null);
  const genres = { fiction: true, nonFiction: true };
  const [showForm, setShowForm] = useState(false);
  const [modalVisible, setModalVisible] = useState(false)
  const [suggestionVisible, setSuggestionVisible] = useState(false)
  const [addBookId, setAddBookId] = useState(null)
  const scrollContainerRef = useRef(null);
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem('theme');
    return storedTheme || 'light';
  });
  const [isDiscoveryUnlocked, setIsDiscoveryUnlocked] = useState(false);


  const API_KEY = import.meta.env.VITE_API_KEY;

  useEffect(() => {
    setIsDiscoveryUnlocked(books.length + usrEnteredBooks.length >= 5);
  }, [books, usrEnteredBooks])

  useEffect(() => {
    localStorage.setItem('books', JSON.stringify(books));
  }, [books])

  useEffect(() => {
    localStorage.setItem('usrEnteredBooks', JSON.stringify(usrEnteredBooks));
  }, [usrEnteredBooks])

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme])

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
            link: item.volumeInfo.infoLink || "#"
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

    let queryString = "";

    if (books.length + usrEnteredBooks.length < 5) {
      queryString = "romance+comedy+fiction";
    } else {
      const favoriteGenres = [...books, ...usrEnteredBooks]
        .map((book) => book.genre)
        .filter((genre) => (genre && genre !== "Unknown"))
        .slice(0, 3)
        .join('+')

      const favoriteKeywords = [...books, ...usrEnteredBooks]
        .map((book) => book.title.split(' ').slice(0, 2).join('+'))

      const favoriteAuthors = [...books, ...usrEnteredBooks]
        .map((book) => book.authors)
        .filter((authors) => (authors && authors != "Unknown"))
        .slice(0,2).join('+')

      queryString = favoriteGenres || favoriteKeywords || favoriteAuthors
        ? `${favoriteGenres}+${favoriteKeywords}`
        : "romance+comedy+fiction";
    }

    let startIndex = Math.floor(Math.random() * 100);

    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${queryString}&startIndex=${startIndex}&maxResults=9&key=${API_KEY}`)
    const data = await response.json();

    if (data.items) {
      setHoldBooks(data.items.map(item => ({
        id: item.id,
        title: item.volumeInfo.title,
        authors: item.volumeInfo.authors || ["Unknown Author"],
        cover: item.volumeInfo.imageLinks ? item.volumeInfo.imageLinks.thumbnail : noThumbnail,
        genre: item.volumeInfo.mainCategory || "Unknown",
        link: item.volumeInfo.infoLink || "#"
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

  useEffect(() => {
    if (books.length + usrEnteredBooks.length >= 5) {
      discoverBooks();
    }
  }, [books, usrEnteredBooks]);


  const addBook = (book) => {
    if (!books.some(existingBook => existingBook.id === book.id)) {
      setSearchInput("");
      setSuggestions([])
      setBooks([...books, book]);
    } else {
      alert("This book is already in your list.");
    }
  }

  const handleSubmit = (event) => {
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
      link: link || "#"
    }

    if (!usrEnteredBooks.some(existingBook => existingBook.id === book.id)) {
      setUsrEnteredBooks([...usrEnteredBooks, book]);
      setShowForm(false);
    } else {
      alert("This book is already in your list.");
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
            <h2>{book.title}</h2>
            <p>Rediscover this book and enjoy your reading journey!</p>
          </>
        )}
      </div>
    )
  }

  const Suggest = ({ book, onClose }) => {
    return (
      <div className='suggest'>
        <button className='suggest-close' onClick={onClose}>X</button>
        <>
          {book.cover && <img src={book.cover} alt={`${book.title} cover`} />}
          <h2><a href={book.link} target='_blank' rel="noopener noreferrer">{book.title}</a></h2>
          <strong>by {book.authors}</strong>
          <p>Discover this book and enjoy your reading journey!</p>
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

  const deleteBook = (id) => {
    setBooks((prevBooks) => prevBooks.filter((book) => book.id !== id));
    setUsrEnteredBooks((prevUsrBooks) => prevUsrBooks.filter((book) => book.id !== id))
  }


  const handleAddBook = (book) => {
    setAddBookId(book.id);
    setTimeout(() => {
      addBook(book);
      setAddBookId(null);
    }, 300);
  }

  const handleThemeSwitch = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"))
  }

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);


  return (
    <div>
      <h2 className='title' onClick={() => pickABook(books, usrEnteredBooks)}>LeafThrough</h2>
      <strong className="instruction-text">
        Add your favorite books to the collection using the search bar or manual entry in the 'Add to Favorites' section.
        When you're ready, click the BookBuddy logo for a surprise pick!
        Explore interesting reads in the 'Discover' section to find books you might love.
      </strong>



      <div className='discover-books'>
        {!isDiscoveryUnlocked && (
          <strong className="unlock-message">Unlock this section by adding {5 - (books.length + usrEnteredBooks.length)} or more books in the Favorites section!</strong>
        )}
        <div className={`discover-books ${!isDiscoveryUnlocked ? 'locked' : ''}`}>
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
          {suggestionVisible && nextReads && (<Suggest book={nextReads} onClose={handleCloseSuggestion} />)}
        </div>

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
              <li key={suggestion.id} className={`add-item ${addBookId === suggestion.id ? 'adding' : ''}`} onClick={() => handleAddBook(suggestion)}>
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
        <h2>Rediscover your favorite books</h2>
        {(books.length === 0 && usrEnteredBooks.length === 0) && <p className='instruction-text'>No books added yet. Start by adding a book</p>}
        <PrintBooks books={books} usrBooks={usrEnteredBooks} deleteBook={deleteBook} />
      </div>

      <button className='switch-theme' onClick={handleThemeSwitch}>{theme === "light" ? "🌙" : "☀️"}</button>

      {modalVisible && <BookModal book={pick} onClose={() => setModalVisible(false)} />}
    </div>
  );
}

export default App;

# LeafThrough

Leaf-through is a react.js application that assists users in discovering and rediscovering their favorite books. It provides functionalities for searching for books online, manually adding them to a list, receiving a surprise book recommendation from the list, and exploring a curated selection of new books.

## Features

Search for books using the integrated Google Books API. 
* Manually add books to a personal list. 
* Receive a surprise book recommendation from the user's list. 
* Discover new books through a curated selection.

## Technologies Used

- Frontend: React.js 

- Backend: Firestore Database (NoSQL)
    
- Styling: CSS 
    
- API Integration: Google Books API
    
- Other: [Netlify](https://www.netlify.com/), Toastify (Notifications)

## Deployment

- Live at: https://leafthrough.netlify.app.

## Firebase Integration
This project uses Firebase for:
- Storing and managing book data (Favorites, Read Later, etc.)
- Saving and retrieving user notes
- Real-time updates for UI consistency

### Branch Information
The Firebase integration resides in the `feature/firebase-integration` branch. However, the live site at [Netlify](https://leafthrough.netlify.app) is updated to use Firebase.

#### Performance Note
Users may experience slight latency during some operations (e.g., adding or deleting books, saving notes). This is due to the Firebase database being hosted in a European region, which may introduce network delays depending on the user's geographic location.

## Installation and Setup

1. Clone the repository:
    
    ```bash
    git clone https://github.com/yourusername/leafthrough.git
    cd leafthrough
    ```
    
2. Install dependencies:
    
    ```bash
    npm install
    ```
    
3. Add your Google Books API key:
    
    - Create a `.env` file in the root directory.
    - Add your API key:
        
        ```
        VITE_API_KEY=your-google-books-api-key
        ```
        
4. Start the development server:
    
    ```bash
    npm run dev
    ```
    
5. Open the application in your browser at `http://localhost:5173`.
    
---

## Contributing

Contributions are welcome! Please fork the repository and create a pull request.

---
### Known Issues
#### Compatibility with Safari

The application may not work as expected on Safari browsers due to potential differences in how Safari handles certain web technologies like CORS policies or service workers.

Use:

    Google Chrome
    Mozilla Firefox

to ensure full functionality.

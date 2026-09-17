import React, { createContext, useState, useCallback } from "react";

export const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const productSearch = useCallback(async (term) => {
    if (!term?.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_SERVER_URL}api/products/search?query=${encodeURIComponent(term)}`
      );

      if (!response.ok) return;

      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
    }
  }, []);

  return (
    <SearchContext.Provider
      value={{
        searchTerm,
        setSearchTerm,
        searchResults,
        productSearch,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
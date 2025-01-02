export const getUserId = () => {
    return localStorage.getItem("userId");
};

export const setUserId = (id) => {
    localStorage.setItem("userId", id);
};

export const clearUserId = () => {
    localStorage.removeItem("userId");
};

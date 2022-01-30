import App from "./components/App.html";
export default app = new App({
    target: ((t) => {
        t.innerHTML = "";
        return t;
    })(document.querySelector("div.slot"))
});
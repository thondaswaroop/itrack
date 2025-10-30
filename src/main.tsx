import { BrowserRouter } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import "./index.css";
import './index.css'
import GlobalStyles from "./styles/globalStyles.tsx";
import App from './App.tsx'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <BrowserRouter>
      <GlobalStyles initial="light" followSystem={false} />
    <App />
  </BrowserRouter>
);

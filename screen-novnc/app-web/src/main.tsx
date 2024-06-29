import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import CMSoft from './cmsoft'
import { Router,Route } from 'react-router'
import Layout from "./layout";

ReactDOM.render(
  <React.StrictMode>
      <App></App>
      {/*<CMSoft></CMSoft>*/}
  </React.StrictMode>,
  document.getElementById('root')
)

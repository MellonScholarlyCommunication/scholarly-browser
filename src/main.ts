import './assets/main.css';

import {createApp} from 'vue';
import App from './App.vue';
import * as VueRouter from "vue-router";


const router = VueRouter.createRouter({
  history: VueRouter.createWebHistory(),
  routes: [{path: "/", component: App, props: true}],
});

const app = createApp(App);
app.use(router);
app.mount("#app");

<script setup lang="ts">
import { useToastStore } from "@/stores/toast";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { computed, onBeforeMount } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";
import "./assets/main.css";

const currentRoute = useRoute();
const currentRouteName = computed(() => currentRoute.name);
const userStore = useUserStore();
const { isLoggedIn, currentUsername } = storeToRefs(userStore);
const { toast } = storeToRefs(useToastStore());

// Make sure to update the session before mounting the app in case the user is already logged in
onBeforeMount(async () => {
  if (toast.value?.message) {
    setTimeout(() => {
      toast.value = null;
    }, 1500);
  }
  try {
    await userStore.updateSession();
  } catch {
    // User is not logged in
  }
});
</script>

<template>
  <header>
    <nav class="sticky">
      <div class="title">
        <img src="@/assets/images/boldnbrash.png" />
        <RouterLink :to="{ name: 'Home' }">
          <h1>Restaurant Reform</h1>
        </RouterLink>
      </div>
      <ul>
        <li>
          <RouterLink :to="{ name: 'Home' }" :class="{ underline: currentRouteName == 'Home' }"> Petitions </RouterLink>
        </li>
        <li>
          <RouterLink :to="{ name: 'RestaurantHome' }" :class="{ underline: currentRouteName == 'RestaurantHome' }"> Restaurants </RouterLink>
        </li>
        <li v-if="isLoggedIn">
          <RouterLink :to="{ name: 'Settings' }" :class="{ underline: currentRouteName == 'Settings' }"> {{ currentUsername }} </RouterLink>
        </li>
        <li v-else>
          <RouterLink :to="{ name: 'Login' }" :class="{ underline: currentRouteName == 'Login' }"> Login </RouterLink>
        </li>
      </ul>
    </nav>
    <article v-if="toast !== null" class="toast" :class="toast.style">
      <p>{{ toast.message }}</p>
    </article>
  </header>
  <RouterView />
</template>

<style>
@import "./assets/main.css";
</style>

<style scoped>
@import "./assets/toast.css";

nav {
  padding: 10px 20px;
  background-color: var(--green);
  display: flex;
  align-items: center;
}

.sticky {
  position: fixed;
  top: 0;
  left: 0;
  right: 0em;
  bottom: calc(100%-5em);
}
.pad {
  padding-top: 1000px;
}
h1 {
  font-size: 2em;
  margin: 0;
}

.title {
  display: flex;
  align-items: center;
  gap: 0.5em;
}

img {
  height: 2em;
}

a {
  font-size: large;
  color: var(--line);
  text-decoration: none;
}

ul {
  list-style-type: none;
  margin-left: auto;
  display: flex;
  align-items: center;
  flex-direction: row;
  gap: 1em;
}

.underline {
  text-decoration: underline;
}
</style>

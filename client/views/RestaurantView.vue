<script setup lang="ts">
import Restaurant from "@/components/Restaurant/Restaurant.vue";
import { onBeforeMount, ref } from "vue";
import router from "../router";
import { fetchy } from "../utils/fetchy";

const restaurant = ref();
const approvedPetitions = ref();
const unapprovedPetitions = ref();
const badges = ref();
const loaded = ref(false);
const forceRenderKey = ref(0);

const refresh = () => {
  forceRenderKey.value += 1
}

onBeforeMount(async () => {
  const restaurantId = router.currentRoute.value.params.id;
  try {
    restaurant.value = await fetchy(`/api/business/id/${restaurantId}`, "GET");
    approvedPetitions.value = await fetchy(`/api/business/${restaurantId}/petitions/approved`, "GET");
    unapprovedPetitions.value = await fetchy(`/api/business/${restaurantId}/petitions/unapproved`, "GET");
    badges.value = await fetchy(`/api/badges/${restaurantId}`, "GET");
    loaded.value = true;
  } catch {
    return;
  }
});
</script>

<template>
  <h2 v-if="!loaded">loading...</h2>
  <Restaurant @refreshResponse="refresh" :key="forceRenderKey" v-else :restaurant="restaurant" :unapprovedPetitions="unapprovedPetitions" :approvedPetitions="approvedPetitions" :badges="badges" />
</template>

<style scoped>
h1 {
  text-align: center;
}

.pad {
  margin-top: 100px;
}
</style>

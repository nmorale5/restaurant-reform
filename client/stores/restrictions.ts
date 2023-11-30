import { defineStore } from "pinia";
import { ref } from "vue";

export const useRestrictionStore = defineStore("user", () => {
  const restrictions = ref([
    "Vegetarian",
    "Vegan",
    "Pescetarian",
    "Gluten-Free",
    "Lactose-Free",
    "Nut-Free",
    "Shellfish-Free",
    "Soy-Free",
    "Egg-Free",
    "Halal",
    "Kosher",
    "Wheat-Free",
    "Fish-Free",
    "Other",
  ]);

  return {
    restrictions,
  };
});

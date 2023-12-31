<script setup lang="ts">
import { useUserStore } from "@/stores/user";
import { formatDate } from "@/utils/formatDate";
import { storeToRefs } from "pinia";
import { onBeforeMount, onUpdated, ref } from "vue";
import router from "../../router";
import { fetchy } from "../../utils/fetchy";

const props = defineProps(["petition"]);
const emit = defineEmits(["editPetition", "refreshPetitions"]);
const { currentUsername, currentUserId, isLoggedIn } = storeToRefs(useUserStore());
const signed = ref(false);
const signers = ref(0);
const restaurantNameLoading = ref(true);
const restaurantName = ref("");
const response: any = ref({});

const deletePetition = async () => {
  try {
    await fetchy(`/api/petition/${props.petition._id}`, "DELETE");
  } catch {
    return;
  }
  emit("refreshPetitions");
};

const updateSigned = async () => {
  let newSigned: boolean;
  let newSigners: number;
  try {
    newSigned = currentUserId.value !== "" ? await fetchy(`/api/upvote/${props.petition._id}/${currentUserId.value}`, "GET") : false;
    newSigners = (await fetchy(`/api/upvote/${props.petition._id}`, "GET")).length;
  } catch {
    return;
  }
  signed.value = newSigned;
  signers.value = newSigners;
};

const trySign = async () => {
  try {
    await fetchy(`/api/petition/${props.petition._id}/${currentUserId.value}`, "PUT");
  } catch {
    return;
  } finally {
    await updateSigned();
  }
};

const tryUnsign = async () => {
  try {
    await fetchy(`/api/upvote/${props.petition._id}/${currentUserId.value}`, "DELETE");
  } catch {
    return;
  } finally {
    await updateSigned();
  }
};

const convertIDtoNames = async () => {
  let restaurant;
  try {
    restaurant = await fetchy(`/api/business/id/${props.petition.target}`, "GET");
  } catch (e) {
    return;
  }
  //props.petition.target = restaurant.name;
  //props.petition.restaurant_name = restaurant.name;
  restaurantName.value = restaurant.name;
  restaurantNameLoading.value = false;
};

const getResponse = async () => {
  let tempResponse;
  try {
    tempResponse = await fetchy(`/api/response/concern/${props.petition._id}`, "GET");
  } catch (e) {
    return;
  }
  response.value = tempResponse;
};

const refreshPetitionList = () => {
  emit("refreshPetitions");
};

const goToResponseFeedbackView = async () => {
  await router.push({ path: `/feedback/${props.petition._id}` });
};

onUpdated(async () => {
  await convertIDtoNames();
});

onBeforeMount(async () => {
  await updateSigned();
  await convertIDtoNames();
  await getResponse();
});

const linkRestaurantButtonToPage = () => {
  void router.push({ name: "Restaurant", params: { id: props.petition.target } });
};
</script>

<template>
  <div class="petition-container">
    <div class="top">
      <h1>{{ props.petition.title }}</h1>
    </div>
    <p v-if="restaurantNameLoading">Loading...</p>
    <p v-else>
      Restaurant: <button @click="linkRestaurantButtonToPage" class="pure-button pure-button-primary pad">{{ restaurantName }}</button>
    </p>
    <p>Topic: {{ props.petition.topic }}</p>
    <p>Problem: {{ props.petition.problem }}</p>
    <p>Solution: {{ props.petition.solution }}</p>
    <div class="line"></div>
    <div v-if="response._id">
      <div v-if="response.type.valueOf() === 1">
        <p class="statement">-- Petition Accepted on {{ formatDate(response.dateCreated, true) }} --</p>
        <p>Response: {{ response.response }}</p>
        <div class="base">
          <button id="view-feedback-button" class="pure-button pure-button-primary" @click="goToResponseFeedbackView">View Feedback</button>
          <p>
            <b>{{ props.petition.creator }}</b>
          </p>
          <article class="timestamp">
            <p>Created on: {{ formatDate(props.petition.dateCreated) }}</p>
          </article>
          <menu v-if="props.petition.creator == currentUsername">
            <li><button class="button-error btn-small pure-button" @click="deletePetition">Delete</button></li>
          </menu>
        </div>
      </div>
      <div v-else>
        <p class="statement">-- Petition Rejected on {{ formatDate(response.dateCreated, true) }} --</p>
        <p>Response: {{ response.response }}</p>
      </div>
    </div>
    <div v-else class="base">
      <div class="progress">
        <div class="sign" v-if="currentUserId">
          <button class="pure-button pure-button-primary" v-if="!signed" @click="trySign">Sign</button>
          <button class="pure-button pure-button-primary" v-else @click="tryUnsign"><em>Signed!</em></button>
        </div>
        <p>Progress: {{ signers }}/{{ props.petition.upvoteThreshold }}</p>
      </div>
      <p>
        <b>{{ props.petition.creator }}</b>
      </p>
      <article class="timestamp">
        <p>Created on: {{ formatDate(props.petition.dateCreated) }}</p>
      </article>
      <menu v-if="props.petition.creator == currentUsername">
        <li><button class="button-error btn-small pure-button" @click="deletePetition">Delete</button></li>
      </menu>
    </div>
  </div>
</template>

<style scoped>
p {
  margin: 0em;
}
.line {
  height: 1px;
  background: var(--line);
  margin: 5px;
}

.statement {
  text-align: center;
}

.progress {
  display: flex;
  align-items: center;
}

.sign {
  margin-left: 5px;
}

.pure-button-primary {
  margin: 2px;
}

.pad {
  padding-top: 1px;
  padding-right: 4px;
  padding-bottom: 1px;
  padding-left: 4px;
  font-weight: light;
}

.petition-container {
  background-color: var(--base-bg);
  border-radius: 10px;
  padding: 10px 10px 0px 10px;
  border-style: solid;
  color: var(--line);
  border-width: 2px;
  display: flex;
  flex-direction: column;
}
.author {
  font-weight: bold;
  font-size: 1.2em;
}

menu {
  list-style-type: none;
  display: flex;
  flex-direction: row;
  gap: 1em;
  padding: 0;
  margin: 0;
}

.timestamp {
  display: flex;
  justify-content: flex-end;
  font-size: 0.9em;
  font-style: italic;
}

.base {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  flex-direction: row;
}

.base article:only-child {
  margin-left: auto;
}

.top {
  text-align: center;
}

.top h1 {
  margin: 5px;
}

.selectables {
  display: flex;
  justify-content: space-between;
}

.selectables p {
  display: flex;
  align-items: center;
}

.tag {
  background-color: var(--blue);
  margin-left: 2px;
  margin-right: 2px;
  border-radius: 5px;
  padding: 4px;
  color: white;
}

.information p {
  padding-top: 5px;
  padding-bottom: 5px;
}

#view-feedback-button {
  margin-top: 8px;
}
</style>

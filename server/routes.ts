import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { AWARD_THRESHOLD, Badge, Business, Emailer, Feedback, Friend, MINIMUM_RATING, Petition, Post, Reputation, Response, Upvote, User, WebSession } from "./app";
import { UnauthenticatedError } from "./concepts/errors";
import { PostDoc, PostOptions } from "./concepts/post";
import { UserDoc } from "./concepts/user";
import { WebSessionDoc } from "./concepts/websession";
import { containsObjectId } from "./framework/utils";

import { PetitionDoc } from "./concepts/petition";
import { RESPONSE_TYPE, ResponseDoc } from "./concepts/response";
import Responses from "./responses";

class Routes {
  @Router.get("/session")
  async getSessionUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await User.getUsers();
  }

  @Router.get("/users/id/:id")
  async getUserById(id: ObjectId) {
    return await User.getUserById(id);
  }

  @Router.get("/users/:username")
  async getUser(username: string) {
    return await User.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: WebSessionDoc, username: string, password: string) {
    WebSession.isLoggedOut(session);
    return await User.create(username, password);
  }

  @Router.patch("/users")
  async updateUser(session: WebSessionDoc, update: Partial<UserDoc>) {
    const user = WebSession.getUser(session);
    return await User.update(user, update);
  }

  @Router.delete("/users")
  async deleteUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    WebSession.end(session);
    return await User.delete(user);
  }

  @Router.post("/login")
  async logIn(session: WebSessionDoc, username: string, password: string) {
    const u = await User.authenticate(username, password);
    WebSession.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: WebSessionDoc) {
    WebSession.end(session);
    return { msg: "Logged out!" };
  }

  @Router.get("/posts")
  async getPosts(author?: string) {
    let posts;
    if (author) {
      const id = (await User.getUserByUsername(author))._id;
      posts = await Post.getByAuthor(id);
    } else {
      posts = await Post.getPosts({});
    }
    return Responses.posts(posts);
  }

  @Router.post("/posts")
  async createPost(session: WebSessionDoc, content: string, options?: PostOptions) {
    const user = WebSession.getUser(session);
    const created = await Post.create(user, content, options);
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/posts/:_id")
  async updatePost(session: WebSessionDoc, _id: ObjectId, update: Partial<PostDoc>) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return await Post.update(_id, update);
  }

  @Router.delete("/posts/:_id")
  async deletePost(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return Post.delete(_id);
  }

  @Router.get("/friends")
  async getFriends(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.idsToUsernames(await Friend.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: WebSessionDoc, friend: string) {
    const user = WebSession.getUser(session);
    const friendId = (await User.getUserByUsername(friend))._id;
    return await Friend.removeFriend(user, friendId);
  }

  @Router.get("/friend/requests")
  async getRequests(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Responses.friendRequests(await Friend.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.sendRequest(user, toId);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.removeRequest(user, toId);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.acceptRequest(fromId, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.rejectRequest(fromId, user);
  }

  @Router.get("/email/testRegister")
  async sendTestEmail() {
    await Emailer.sendRegisterEmail({
      toAddress: "61040-team-mank@mit.edu",
      businessName: "McDonald's",
      token: "SOMETOKEN",
    });
  }

  @Router.get("/email/testThreshold")
  async sendEmail() {
    await Emailer.sendThresholdEmail({
      toAddress: "61040-team-mank@mit.edu",
      businessName: "McDonald's",
      token: "SOMETOKEN",
      signers: 100,
      petition: {
        title: "Gluten Free Buns At McDonald's",
        problem: "Not enough gluten-free options for McDonald's",
        solution: "Make gluten-free buns",
      },
    });
  }

  @Router.delete("/business")
  async deleteBusiness() {
    // WARNING: FOR TESTING ONLY! This deletes a random business
    await Business.deleteBusiness();
  }

  @Router.get("/business")
  async getAllBusinesses() {
    return await Business.getAllBusinesses();
  }

  @Router.get("/business/id/:id")
  async getBusiness(id: ObjectId) {

    try {
      return await Business.getBusiness(new ObjectId(id));
    } catch (e) {
      return
    }
  }

  @Router.get("/business/:filter")
  async getBusinesses(filter?: string) {
    return await Business.getAllBusinesses(filter);
  }

  @Router.get("/business/user/:userId")
  async getUserBusinesses(userId: ObjectId) {
    const businesses = await Business.getAllBusinesses("");
    const yourBusinesses = businesses.filter((business) => containsObjectId(business.users, userId));
    return yourBusinesses;
  }

  @Router.post("/business")
  async addBusiness(name: string, email: string) {
    const businessValues = await Business.addBusiness(name, email);
    await Emailer.sendRegisterEmail({
      toAddress: email,
      businessName: name,
      token: businessValues.token,
    });
    return businessValues.id;
  }

  @Router.put("/business/users")
  async addUserToBusiness(userId: ObjectId, token: string) {
    return await Business.addUser(userId, token);
  }

  @Router.delete("/business/users")
  async removeUserFromBusiness(userId: ObjectId, token: string) {
    return await Business.removeUser(userId, token).catch();
  }

  @Router.get("/business/:businessId/petitions/")
  async getBusinessPetitions(businessId: ObjectId) {
    return await Petition.getAllPetitions(businessId);
  }

  @Router.get("/business/:businessId/petitions/unapproved") 
  async getUnapprovedBusinessPetitions(businessId: ObjectId) {
    const unapproved: PetitionDoc[] = [];
    const allPetitions = await Petition.getAllPetitions(businessId);
    for (const petition of allPetitions) {
      const numSigners = (await Upvote.getUpvotes(petition._id)).length;
      if (numSigners < petition.upvoteThreshold) {
        unapproved.push(petition);
      }
    }
    return unapproved;
  }

  @Router.get("/business/:businessId/petitions/approved")
  async getApprovedBusinessPetitions(businessId: ObjectId) {
    const approved: PetitionDoc[] = [];
    const allPetitions = await Petition.getAllPetitions(businessId);
    for (const petition of allPetitions) {
      const numSigners = (await Upvote.getUpvotes(petition._id)).length;
      if (numSigners >= petition.upvoteThreshold) {
        approved.push(petition);
      }
    }
    return approved;
  }

  @Router.get("/petitions/approved")
  async isPetitionApproved(petitionId: ObjectId) {
    const petition = await Petition.getPetition(petitionId);

    const numSigners = (await Upvote.getUpvotes(petition._id)).length;
    return numSigners >= petition.upvoteThreshold;
  }

  @Router.put("/petition/:petitionId/:signerId")
  async signPetition(session: WebSessionDoc, petitionId: ObjectId, signerId: ObjectId) {
    if (!WebSession.getUser(session).equals(signerId)) {
      throw new UnauthenticatedError("signerId is different from session user id");
    }

    await Upvote.addUpvote(new ObjectId(petitionId), new ObjectId(signerId));

    const petition = await Petition.getPetition(new ObjectId(petitionId));
    const signers = (await Upvote.getUpvotes(new ObjectId(petitionId))).length;
    const business = await Business.getBusiness(petition.target);

    // send email to target once threshold is met
    if (signers === petition.upvoteThreshold) {
      await Emailer.sendThresholdEmail({
        toAddress: business.email,
        businessName: business.name,
        token: business.token,
        signers: signers,
        petition: {
          title: petition.title,
          problem: petition.problem,
          solution: petition.solution,
        },
      });
    }
    return {msg: ""}
  }

  @Router.put("/upvote/:postId/:userId")
  async upvotePost(session: WebSessionDoc, postId: ObjectId, userId: ObjectId) {
    if (!WebSession.getUser(session).equals(userId)) {
      throw new UnauthenticatedError("userId is different from session user id");
    }
    await Upvote.addUpvote(new ObjectId(postId), userId);
  }

  @Router.delete("/upvote/:postId/:userId")
  async removeUpvotePost(session: WebSessionDoc, postId: ObjectId, userId: ObjectId) {
    if (!WebSession.getUser(session).equals(userId)) {
      throw new UnauthenticatedError("userId is different from session user id");
    }
    await Upvote.removeUpvote(new ObjectId(postId), userId);
  }

  @Router.get("/upvote/:postId/:userId")
  async isUpvoting(postId: ObjectId, userId: ObjectId) {
    return await Upvote.isUpvoting(new ObjectId(postId), userId);
  }

  @Router.get("/upvote/:postId")
  async getUpvotes(postId: ObjectId) {
    return await Upvote.getUpvotes(new ObjectId(postId));
  }

  @Router.post("/petition")
  async createPetition(session: WebSessionDoc, title: string, problem: string, solution: string, topic: string, restaurant: ObjectId) {
    const user = await User.getUserById(WebSession.getUser(session));
    const threshold = 1;
    return await Petition.createPetition(title, problem, solution, topic, restaurant, user.username, threshold);
  }

  @Router.get("/petitions/all")
  async getAllPetitions() {
    return await Petition.getAllPetitions();
  }

  @Router.get("/petition/:id")
  async getPetition(id: ObjectId) {
    return await Petition.getPetition(id);
  }

  @Router.delete("/petition/:id")
  async deletePetition(id: ObjectId) {
    return await Petition.deletePetition(id);
  }

  @Router.get("/petitions/business/:business")
  async getPetitionsByTarget(business: ObjectId) {
    return await Petition.getAllPetitions(business);
  }

  @Router.get("/petitions/user/:username")
  async getPetitionsByCreator(username: string) {
    return await Petition.getAllPetitions(undefined, username);
  }

  @Router.get("/petitions/filter/:search")
  async filterPetitionsBySearch(search: string) {
    const inputWords = search.split(" ");
    return await Petition.filterPetitions(inputWords);
  }

  @Router.post("/response")
  async createResponse(concern: ObjectId, response: string, type: RESPONSE_TYPE) {
    const res = await Response.createResponse(new ObjectId(concern), response, Number(type));
    // response possibly null
    if (res.post !== null) {
      if (res.post.type == 1) {
        // accept response
        Feedback.enterFeedbackState(res.post._id);
        return { msg: "Response created!"}
      }
    }
  }

  @Router.get("/response/:id")
  async getResponse(id: ObjectId) {
    try {
      return await Response.getResponse(id);
    } catch (e) {
      return null;
    }
  }

  @Router.get("/response/concern/:concern")
  async getResponseByConcern(concern: ObjectId) {
    try {
      const res = await Response.getResponseByConcern(new ObjectId(concern));
      return res;
    } catch (e) {
      return null;
    }
  }

  @Router.delete("/response/:id")
  async deleteResponse(id: ObjectId) {
    return await Response.deleteResponse(id);
  }

  // sync to get all responses associated with a business
  @Router.get("/response/business/:business")
  async getResponseByBusiness(business: ObjectId) {
    const businessPetitions = await Petition.getAllPetitions(business);
    // Array.filter doesn't work with async functions apparently, had to do this
    const hasResponseArr = await Promise.all(businessPetitions.map(async (petition) => {
      return await Response.hasResponse(petition._id)
    }))
    const respondedPetitions = businessPetitions.filter((petition, i) => {
      return hasResponseArr[i]
    })

    const responses: Array<Promise<ResponseDoc>> = respondedPetitions.map((petition) => {
      return Response.getResponseByConcern(petition._id);
    });

    return await Promise.all(responses);
  }

  @Router.get("/badges/:owner")
  async getBadges(owner: ObjectId) {
    return await Badge.getBadges(new ObjectId(owner));
  }

  @Router.post("/badges/:owner/:badgeName")
  async addBadge(owner: ObjectId, badgeName: string) {
    return await Badge.add(new ObjectId(owner), badgeName);
  }

  @Router.delete("/badges/:owner/:badgeName")
  async removeBadge(owner: ObjectId, badgeName: string) {
    return await Badge.remove(owner, badgeName);
  }

  @Router.get("/badges/test/addRandomBadge")
  async addRandomBadge() {
    const allB = await Business.getAllBusinesses();
    const business = allB.at(Math.floor(Math.random() * allB.length));
    return await Badge.add(business!._id, "nuts");
  }

  @Router.post("/reputation/increase/:business")
  async increaseReputation(business: ObjectId) {
    return await Reputation.updateReputation(business, 1);
  }

  @Router.post("/reputation/decrease/:business")
  async decreaseReputation(business: ObjectId) {
    return await Reputation.updateReputation(business, -1);
  }

  @Router.get("/reputation/:business")
  async getReputation(business: ObjectId) {
    return await Reputation.getEntityReputation(business);
  }

  @Router.get("/feedback/state/:response")
  async getFeedBackState(response: ObjectId) {
    return await Feedback.getFeedbackState(response);
  }

  @Router.get("/feedback/ratio/:response")
  async getAverageRating(response: ObjectId) {
    return await Feedback.getAverageRating(response);
  }

  @Router.get("/feedback/userFeedback/:response")
  async getUserFeedback(session: WebSessionDoc, response: ObjectId) {
    const responseId = new ObjectId(response);
    const user = WebSession.getUser(session);

    return await Feedback.getOneUserFeedback(user, responseId);
  }

  @Router.get("/feedback/all/userFeedback/:response")
  async getAllUserFeedback(response: ObjectId) {
    return await Feedback.getAllFeedback(new ObjectId(response));
  }

  @Router.post("/feedback/responses/:response")
  async createFeedback(session: WebSessionDoc, response: ObjectId, feedback: string, rating: number, decision: boolean) {
    const user = WebSession.getUser(session);
    const responseID = new ObjectId(response);
    const res = await Response.getResponse(responseID);

    await Feedback.createFeedback(user, responseID, feedback, Number(rating), decision);

    if ((await Feedback.getAllFeedback(responseID)).length === AWARD_THRESHOLD) {
      const ratio = await Feedback.getAverageRating(responseID);
      const petition = await Petition.getPetition(res.concern);

      if (ratio >= MINIMUM_RATING) {
        // TODO: Remove attempt badge?
        await Badge.add(new ObjectId(petition.target), petition.topic);
        await Feedback.updateFeedbackState(responseID, true, false);
        await Reputation.updateReputation(petition.target, 1);
      } else {
        await Feedback.updateFeedbackState(responseID, false, false);
        await Reputation.updateReputation(petition.target, -1);
      }

      return { msg: "Response successfully evaluated!" };
    }
  }

  @Router.delete("/feedback/responses/:response")
  async deleteFeedback(session: WebSessionDoc, response: ObjectId) {
    const user = WebSession.getUser(session);
    return await Feedback.deleteUserFeedback(user, response);
  }
}

export default getExpressRouter(new Routes());

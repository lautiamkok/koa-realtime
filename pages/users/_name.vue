<template>
  <div class="user-container">
    <h1 class="title">
      User
    </h1>
    <h2 class="info">
      {{ user.name }}
    </h2>
    <nuxt-link class="button" to="/users">
      Users
    </nuxt-link>
  </div>
</template>

<script>
import axios from '~/plugins/axios'

export default {
  name: 'name',
  asyncData ({ params, error }) {
    console.log(params)
    return axios.get('/api/users/' + params.name)
      .then((res) => {
        return { user: res.data.data }
      })
      .catch((e) => {
        error({ statusCode: 404, message: 'User not found' })
      })
  },
  head () {
    return {
      title: `User: ${this.user.name}`
    }
  }
}
</script>

<style scoped>
.user-container {
  margin-bottom: 10px;
}
.title {
  margin-top: 30px;
}
.info {
  font-weight: 300;
  color: #9aabb1;
  margin: 0;
  margin-top: 10px;
}
.button {
  margin-top: 30px;
}
</style>

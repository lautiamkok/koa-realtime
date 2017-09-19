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
import socket from '~/plugins/socket.io'

export default {
  name: 'name',
  asyncData ({ params, error }) {
    console.log(params)
    return axios.get('/api/users/' + params.name)
      .then((res) => {
        return {
          user: res.data.data
        }
      })
      .catch((e) => {
        error({ statusCode: 404, message: 'User not found' })
      })
  },
  head () {
    return {
      title: `User: ${this.user.name}`
    }
  },
  created () {
    socket.on('users.changed', function(data) {

      // Make sure there are new_val & old_val in data.
      if (data.new_val === undefined && data.old_val === undefined) {
        return
      }

      // Update the current user.
      if(data.new_val !== null && data.old_val !== null) {
        this.user = data.new_val
      }

    }.bind(this))
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

<template>
  <div>
    <h1 class="title">
        USERS
      </h1>
      <ul class="users">
        <li v-for="(user, index) in users" :key="index" class="user">
          <nuxt-link :to="'users/' + user.name">
            {{ user.name }}
          </nuxt-link>
        </li>
      </ul>
  </div>
</template>

<script>
import axios from '~/plugins/axios'
import socket from '~/plugins/socket.io'

export default {
  async asyncData () {
    let { data } = await axios.get('/api/users')
    return {
      users: data.data
    }
  },
  head () {
    return {
      title: 'Users'
    }
  },
  created () {
    socket.on('users.changed', function(data) {
      // Push the new user in.
      if(data.new_val !== undefined && data.new_val !== null) {
        this.users.push(data.new_val)
      }
      // Pop off the deleted user.
      if(data.old_val !== undefined && data.old_val !== null) {
        var id = data.old_val.id
        var index = this.users.map(function(el) {
          return el.id;
        }).indexOf(id);
        this.users.splice(index, 1)
      }
    }.bind(this))
  }
}
</script>

<style scoped>
.title {
  margin-top: 30px;
}
.users {
  list-style: none;
  margin: 0;
  padding: 0;
}
.user {
  margin: 10px 0;
}
</style>

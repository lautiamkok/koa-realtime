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
  mounted () {
    socket.on('users.changed', function(data) {

      // Make sure there are new_val & old_val in data.
      if (data.new_val === undefined && data.old_val === undefined) {
        return
      }

      // Push the new user in.
      if(data.old_val === null && data.new_val !== null) {
        this.users.push(data.new_val)
      }

      // Pop off the deleted user.
      if(data.new_val === null && data.old_val !== null) {
        var id = data.old_val.id
        // Find index of the deleted item.
        var index = this.users.map(function(el) {
          return el.id
        }).indexOf(id)
        this.users.splice(index, 1)
      }

      // Update the current user.
      if(data.new_val !== null && data.old_val !== null) {
        var id = data.new_val.id
        // Another method finding index of an item.
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex
        // var index = array.findIndex(function(item) {return item.id === id})
        var index = this.users.findIndex(item => item.id === id)
        this.users.splice(index, 1, data.new_val)
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

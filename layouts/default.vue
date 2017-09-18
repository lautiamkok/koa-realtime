<template>
  <div class="container">
    <img src="~/assets/img/logo.png" alt="Nuxt.js Logo" class="logo" />
    <!-- Make sure to add the <nuxt/> component when creating a layout to display the page component. -->
    <!-- https://nuxtjs.org/guide/views#layouts -->
    <nuxt/>
    <my-footer/>
  </div>
</template>

<script>
import MyFooter from '~/components/footer.vue'

export default {
  components: {
    MyFooter
  }
}
</script>

<style>
.container {
  margin: 0;
  width: 100%;
  padding: 100px 0;
  text-align: center;
}
</style>

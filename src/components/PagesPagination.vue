<script lang="ts">
import {defineComponent} from 'vue'
import {MDBCard, MDBCardBody, MDBCardText, MDBPageItem, MDBPagination} from "mdb-vue-ui-kit";

type Page = {
  uri: string,
  sort: any,
  active: boolean,
};

export default defineComponent({
  name: "PagesPagination",
  components: {MDBCardText, MDBCardBody, MDBCard, MDBPageItem, MDBPagination},
  props: [
    'pages',
    'loadPage'
  ],
})
</script>

<template>
  <MDBCard v-if="pages?.length">
    <MDBCardBody class="w-100">
      <MDBCardText>
        <nav>
          <MDBPagination style="margin-bottom: 0;">
            <MDBPageItem v-for="(page, index) in pages" :key="index" :active="page.active" @click="loadPage(page)">
              {{ page.uri }}
            </MDBPageItem>
          </MDBPagination>
        </nav>
      </MDBCardText>
    </MDBCardBody>
  </MDBCard>
</template>

<style scoped>

</style>

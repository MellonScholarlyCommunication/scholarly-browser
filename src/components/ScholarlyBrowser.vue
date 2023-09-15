<template>
  <MDBContainer>
    <h1>Scholarly Browser</h1>

    <MDBCard>
      <MDBCardBody class="w-100">
        <MDBCardText>
          <MDBInput label="URL" v-model="url" @change="urlUpdated"/>

        </MDBCardText>
      </MDBCardBody>
    </MDBCard>
  </MDBContainer>
</template>

<script lang="ts">
import {MDBCard, MDBCardBody, MDBCardText, MDBContainer, MDBInput} from "mdb-vue-ui-kit";
import {exploreArtifact, getMembersOfFragment} from "artifact-explorer";

export default {
  name: "ScholarlyBrowser",
  components: {
    MDBContainer,
    MDBCard,
    MDBCardBody,
    MDBCardText,
    MDBInput,
  },
  data() {
    return {
      url: '',
    };
  },
  methods: {
    async urlUpdated() {
      const artifact = await exploreArtifact(this.url);
      console.log(artifact);
      const members = await getMembersOfFragment(artifact.relations[0].node);
      console.log(members);

    },
  }
}
</script>

<style scoped>
h1 {
  margin-top: 2rem;
}

.card {
  margin-bottom: 2rem;
}
</style>

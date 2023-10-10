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
    <MDBCard>
      <MDBCardBody class="w-100">
        <MDBCardText>
          <p v-if="loading" class="status-message">Loading notifications...</p>
          <p v-if="noEventLog" class="status-message"><b>No event log found.</b> Make sure the provided URL contains a ldes:EventStream Link header.</p>
          <MDBCard v-for="(member, index) in members" :key="index"
                   :border="getStyleByMainType(member.content.mainTypes[0])">
            <MDBCardBody class="w-100" style="padding-bottom: 0;">
              <MDBCardTitle>{{ member.content.mainTypes.join(', ') }}</MDBCardTitle>
              <MDBCardTitle subtitle class="mb-2 text-muted">{{
                  member.content.secondaryTypes.join(', ')
                }}
              </MDBCardTitle>
              <MDBCardText>
                <p><b>Actor:</b> <a :href="member.content.actorUrl">{{ member.content.actorName }}</a></p>
                <p><b>Target:</b> <a :href="member.content.targetUrl">{{ member.content.targetName }}</a></p>
                <p><b>Object:</b> <a :href="'/?url=' + member.content.object">{{ member.content.object }}</a></p>
              </MDBCardText>
            </MDBCardBody>
            <MDBCardFooter class="text-muted">{{ member.metadata.dateTime }}</MDBCardFooter>
          </MDBCard>
        </MDBCardText>
      </MDBCardBody>
    </MDBCard>
  </MDBContainer>
</template>

<script lang="ts">
import {MDBCard, MDBCardBody, MDBCardFooter, MDBCardText, MDBCardTitle, MDBContainer, MDBInput} from "mdb-vue-ui-kit";
import {exploreArtifact, getContentOfMember, getMembersOfFragment, getMetadataOfMember} from "artifact-explorer";

export default {
  name: "ScholarlyBrowser",
  components: {
    MDBContainer,
    MDBCard,
    MDBCardBody,
    MDBCardText,
    MDBInput,
    MDBCardFooter,
    MDBCardTitle,
  },
  data() {
    return {
      url: '',
      members: [] as any[],
      loading: false,
      noEventLog: false,
    };
  },
  created() {
    this.$watch('$route.query.url', () => {
      this.url = this.$route.query.url as string || '';
      this.urlUpdated();
    });
  },
  methods: {
    async urlUpdated() {
      this.noEventLog = false;
      this.loading = false;
      this.$router.push({query: {url: this.url}});

      if (!this.url) {
        this.members = [];
        return;
      }

      this.loading = true;

      let artifact: any;
      try {
        artifact = await exploreArtifact(this.url);
      } catch (e) {
        this.noEventLog = true;
        this.loading = false;
        return;
      }
      const fragementUrl = artifact.relations[0].node;
      const members = await getMembersOfFragment(fragementUrl);

      this.members = await Promise.all(members.map(async member => {
        const content = await getContentOfMember(member);
        content.mainTypes = await this.getMainTypes(content.types);
        content.secondaryTypes = await this.getSecondaryTypes(content.types);

        const metadata = await getMetadataOfMember(fragementUrl, member);
        const dt = metadata.dateTime.split(/\D+/);
        metadata.dateTime = new Date(Date.UTC(dt[0], --dt[1], dt[2], dt[3], dt[4], dt[5], dt[6])).toLocaleString();

        return {
          content: content,
          metadata: metadata,
        };
      }));

      this.loading = false;
    },
    async getMainTypes(types: string[]) {
      return await Promise.all(types.filter(type => type.startsWith('https://www.w3.org/ns/activitystreams#')).map(async type => await this.getPrefixedProperty(type)));
    },
    async getSecondaryTypes(types: string[]) {
      return await Promise.all(types.filter(type => !type.startsWith('https://www.w3.org/ns/activitystreams#')).map(async type => await this.getPrefixedProperty(type)));
    },
    async getPrefixedProperty(property: string) {
      // Do a fetch to prefix.cc, this will trigger in a redirect to the prefix.cc page with the prefix that we are looking for.
      const response = await fetch(`https://prefixcc-proxy.smessie.com/?q=${encodeURIComponent(property)}`);
      // Now get the prefix from the URL of the response.
      return response.url.split('prefix.cc/')[1];
    },
    getStyleByMainType(type: string) {
      switch (type) {
        case 'as:Create':
          return 'success';
        case 'as:Remove':
          return 'dark';
        case 'as:Announce':
          return 'warning';
        case 'as:Offer':
          return 'primary';
        case 'as:Accept':
          return 'info';
        case 'as:Reject':
          return 'danger';
        case 'as:Undo':
          return 'secondary';
        case 'as:Update':
        default:
          return 'light';
      }
    }
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

.status-message {
  font-style: italic;
}
</style>

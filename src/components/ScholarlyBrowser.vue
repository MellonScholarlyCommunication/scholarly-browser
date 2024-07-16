<template>
  <a href="https://github.com/MellonScholarlyCommunication/scholarly-browser"
  ><img
      loading="lazy"
      width="149"
      height="149"
      src="/forkme_right_gray.png"
      class="attachment-full size-full fork"
      alt="Fork me on GitHub"
      data-recalc-dims="1"
  /></a>
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
          <p v-if="noEventLog" class="status-message"><b>No event log found.</b> Make sure the provided URL contains a
            ldes:EventStream Link header.</p>
          <MDBCard v-for="(member, index) in members" :key="index"
                   :border="getStyleByMainType(member.mainTypes[0])">
            <MDBCardBody class="w-100" style="padding-bottom: 0;">
              <MDBCardTitle>{{ member.mainTypes.join(', ') }}</MDBCardTitle>
              <MDBCardTitle subtitle class="mb-2 text-muted">{{
                  member.secondaryTypes.join(', ')
                }}
              </MDBCardTitle>
              <MDBCardText>
                <p>
                  <b>Actor: </b>
                  <a :href="member.actorUrl">{{ member.actorName ?? member.actorUrl }}</a>
                </p>
                <p>
                  <b>Target: </b>
                  <a v-if="member.targetUrl" :href="member.targetUrl">{{
                      member.targetName ?? member.targetUrl
                    }}</a>
                  <i v-else>&lt;not provided&gt;</i>
                </p>
                <p>
                  <b>Context: </b>
                  <a v-if="member.context" :href="'?url=' + member.context">{{ member.context }}</a>
                  <i v-else>&lt;not provided&gt;</i>
                </p>
                <p>
                  <b>Object: </b>
                  <a :href="'?url=' + member.object">{{ member.object }}</a>
                </p>
                <ul>
                  <li v-for="(type, index) in member.objectTypes" :key="index">
                    {{ type }}
                    <ul v-if="type === 'as:Relationship'">
                      <li>
                        <b>Subject: </b>
                        <a :href="member.objectRelationship.subject">{{ member.objectRelationship.subject }}</a>
                      </li>
                      <li>
                        <b>Relationship: </b>
                        <a :href="member.objectRelationship.relationship">{{
                            member.objectRelationship.relationship
                          }}</a>
                      </li>
                      <li>
                        <b>Object: </b>
                        <a :href="member.objectRelationship.object">{{ member.objectRelationship.object }}</a>
                      </li>
                    </ul>
                  </li>
                </ul>
              </MDBCardText>
            </MDBCardBody>
          </MDBCard>
        </MDBCardText>
      </MDBCardBody>
    </MDBCard>
  </MDBContainer>
</template>

<script lang="ts">
import {MDBCard, MDBCardBody, MDBCardText, MDBCardTitle, MDBContainer, MDBInput} from "mdb-vue-ui-kit";
import {exploreArtifact} from "artifact-explorer";

type Page = {
  uri: string,
  sort: any,
  active: boolean,
};

export default {
  name: "ScholarlyBrowser",
  components: {
    MDBContainer,
    MDBCard,
    MDBCardBody,
    MDBCardText,
    MDBInput,
    MDBCardTitle,
  },
  data() {
    return {
      url: '',
      members: [] as any[],
      pages: [] as Page[],
      loading: false,
      noEventLog: false,
      artifact: undefined as any,
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
      this.artifact = undefined;
      this.pages = [];
      this.members = [];
      this.$router.push({query: {url: this.url}});

      if (!this.url) {
        return;
      }

      this.loading = true;

      try {
        const membersStream: any = await exploreArtifact(this.url);
        membersStream.on('data', async (member: any) => {
          member = await member;
          member.mainTypes = await this.getMainTypes(member.types);
          member.secondaryTypes = await this.getSecondaryTypes(member.types);
          member.objectTypes = await Promise.all(await member?.objectTypes.map(async (type: string) => await this.getPrefixedProperty(type))) ?? [];

          this.members.push(member);

          this.loading = false;
        });

        membersStream.on('end', () => {
          this.loading = false;
        });
      } catch (e) {
        this.noEventLog = true;
        this.loading = false;
        return;
      }
    },
    async getMainTypes(types: string[]) {
      return await Promise.all(types.filter(type => type.startsWith('https://www.w3.org/ns/activitystreams#')).map(async type => await this.getPrefixedProperty(type)));
    },
    async getSecondaryTypes(types: string[]) {
      return await Promise.all(types.filter(type => !type.startsWith('https://www.w3.org/ns/activitystreams#')).map(async type => await this.getPrefixedProperty(type)));
    },
    async getPrefixedProperty(property: string) {
      // Do a fetch to prefix.cc, this will trigger in a redirect to the prefix.cc page with the prefix that we are looking for.
      const response = await fetch(`https://prefixcc-proxy.smessie.com/?q=${encodeURIComponent(property)}`, {
        method: 'HEAD',
      });
      // Check if a redirect happened.
      if (response.url.includes(`/?q=${encodeURIComponent(property)}`)) {
        // No redirect happened, so the prefix is not known.
        return property;
      }
      // Now get the prefix from the URL of the response.
      return response.url.split('prefixcc-proxy.smessie.com/')[1];
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

.status-message {
  font-style: italic;
}

.fork {
  float: right;
  margin-top: -3em;
}
</style>

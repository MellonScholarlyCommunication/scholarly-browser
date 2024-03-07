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

    <PagesPagination :load-page="loadPage" :pages="pages.sort((a, b) => a.sort < b.sort ? -1 : 1)"></PagesPagination>

    <MDBCard>
      <MDBCardBody class="w-100">
        <MDBCardText>
          <p v-if="loading" class="status-message">Loading notifications...</p>
          <p v-if="noEventLog" class="status-message"><b>No event log found.</b> Make sure the provided URL contains a
            ldes:EventStream Link header.</p>
          <MDBCard v-for="(member, index) in members" :key="index"
                   :border="getStyleByMainType(member.content.mainTypes[0])">
            <MDBCardBody class="w-100" style="padding-bottom: 0;">
              <MDBCardTitle>{{ member.content.mainTypes.join(', ') }}</MDBCardTitle>
              <MDBCardTitle subtitle class="mb-2 text-muted">{{
                  member.content.secondaryTypes.join(', ')
                }}
              </MDBCardTitle>
              <MDBCardText>
                <p>
                  <b>Actor: </b>
                  <a :href="member.content.actorUrl">{{ member.content.actorName ?? member.content.actorUrl }}</a>
                </p>
                <p>
                  <b>Target: </b>
                  <a v-if="member.content.targetUrl" :href="member.content.targetUrl">{{
                      member.content.targetName ?? member.content.targetUrl
                    }}</a>
                  <i v-else>&lt;not provided&gt;</i>
                </p>
                <p>
                  <b>Context: </b>
                  <a v-if="member.content.context" :href="'?url=' + member.content.context">{{
                      member.content.context
                    }}</a>
                  <i v-else>&lt;not provided&gt;</i>
                </p>
                <p>
                  <b>Object: </b>
                  <a :href="'?url=' + member.content.object">{{ member.content.object }}</a>
                </p>
                <ul>
                  <li v-for="(type, index) in member.content.objectTypes" :key="index">
                    {{ type }}
                    <ul v-if="type === 'as:Relationship'">
                      <li>
                        <b>Subject: </b>
                        <a :href="member.content.objectRelationship.subject">{{
                            member.content.objectRelationship.subject
                          }}</a>
                      </li>
                      <li>
                        <b>Relationship: </b>
                        <a :href="member.content.objectRelationship.relationship">{{
                            member.content.objectRelationship.relationship
                          }}</a>
                      </li>
                      <li>
                        <b>Object: </b>
                        <a :href="member.content.objectRelationship.object">{{
                            member.content.objectRelationship.object
                          }}</a>
                      </li>
                    </ul>
                  </li>
                </ul>
              </MDBCardText>
            </MDBCardBody>
            <MDBCardFooter class="text-muted">{{ member.metadata.dateTime }}</MDBCardFooter>
          </MDBCard>
        </MDBCardText>
      </MDBCardBody>
    </MDBCard>

    <PagesPagination :load-page="loadPage" :pages="pages.sort((a, b) => a.sort < b.sort ? -1 : 1)"></PagesPagination>
  </MDBContainer>
</template>

<script lang="ts">
import {MDBCard, MDBCardBody, MDBCardFooter, MDBCardText, MDBCardTitle, MDBContainer, MDBInput} from "mdb-vue-ui-kit";
import {exploreArtifact, getMembersOfFragment} from "artifact-explorer";
import PagesPagination from "@/components/PagesPagination.vue";

type Page = {
  uri: string,
  sort: any,
  active: boolean,
};

export default {
  name: "ScholarlyBrowser",
  components: {
    PagesPagination,
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
        this.artifact = await exploreArtifact(this.url);
      } catch (e) {
        this.noEventLog = true;
        this.loading = false;
        return;
      }
      let firstPage = true;

      this.artifact.pages.on('data', async (page: any) => {
        page.active = false;
        this.pages.push(page);
        if (firstPage) {
          firstPage = false;

          await this.loadPage(page);
        }
      });
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
    async loadPage(page: Page) {
      this.pages.forEach(page => page.active = false);
      page.active = true;

      this.members = [];
      this.loading = true;

      const members = await getMembersOfFragment(this.artifact.url, page.uri, this.artifact.type);

      members.on('data', async (member: any) => {
        member = await member;
        member.content.mainTypes = await this.getMainTypes(member.content.types);
        member.content.secondaryTypes = await this.getSecondaryTypes(member.content.types);
        member.content.objectTypes = await Promise.all(await member.content?.objectTypes.map(async (type: string) => await this.getPrefixedProperty(type))) ?? [];

        if (member.metadata.dateTime) {
          const dt = member.metadata.dateTime.split(/\D+/);
          member.metadata.dateTime = new Date(Date.UTC(dt[0], --dt[1], dt[2], dt[3], dt[4], dt[5], dt[6])).toLocaleString();
        }

        this.members.push(member);

        this.loading = false;
      });

      members.on('end', () => {
        this.loading = false;
      });
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

.fork {
  float: right;
  margin-top: -3em;
}
</style>

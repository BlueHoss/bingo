<script lang="ts">
  import { user, signIn, signUp } from "$lib/auth";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import Button from "$lib/components/ui/button.svelte";
  import * as Card from "$lib/components/ui/card";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Badge } from "$lib/components/ui/badge";
  import { onMount } from "svelte";
  import { browser } from "$app/environment";

  let isLogin = true;
  let email = "";
  let password = "";
  let displayName = "";
  let loading = false;
  let error = "";
  let inviteToken = "";

  $: inviteToken = $page.url.searchParams.get('invite') || '';

  onMount(() => {
    // Check for pending invite token in localStorage
    if (browser) {
      const pendingToken = localStorage.getItem('pendingInviteToken');
      if (pendingToken) {
        inviteToken = pendingToken;
        localStorage.removeItem('pendingInviteToken');
      }
    }

    // Redirect to dashboard if already logged in (unless there's an invite)
    if ($user && !inviteToken) {
      goto("/dashboard");
    }
  });

  $: if ($user && inviteToken) {
    // User just signed up/in and there's a pending invite
    goto(`/invite/${inviteToken}`);
  } else if ($user && !inviteToken) {
    goto("/dashboard");
  }

  async function handleSubmit() {
    loading = true;
    error = "";

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, displayName);
      }
    } catch (e) {
      error = e instanceof Error ? e.message : "An error occurred";
    }

    loading = false;
  }

  function toggleMode() {
    isLogin = !isLogin;
    error = "";
  }
</script>

<svelte:head>
  <title>Cruise Bingo - {isLogin ? "Sign In" : "Sign Up"}</title>
</svelte:head>

<div
  class="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800"
>
  <!-- Hero Section -->
  <div class="flex-1 flex items-center justify-center p-4">
    <div
      class="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center"
    >
      <!-- Left side - Branding and features -->
      <div class="text-center lg:text-left space-y-6">
        <div class="space-y-2">
          <div
            class="flex items-center justify-center lg:justify-start gap-2 mb-4"
          >
            <div
              class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground"
            >
              <span class="text-xl font-bold">CB</span>
            </div>
            <h1 class="text-4xl font-bold tracking-tight">Cruise Bingo</h1>
          </div>
          <p class="text-xl text-muted-foreground">
            The ultimate multiplayer bingo experience for your cruise adventures
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <div
            class="flex items-center gap-3 p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
          >
            <div class="h-2 w-2 rounded-full bg-green-500"></div>
            <span class="text-sm font-medium">Multiplayer Games</span>
          </div>
          <div
            class="flex items-center gap-3 p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
          >
            <div class="h-2 w-2 rounded-full bg-blue-500"></div>
            <span class="text-sm font-medium">Real-time Leaderboards</span>
          </div>
          <div
            class="flex items-center gap-3 p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
          >
            <div class="h-2 w-2 rounded-full bg-purple-500"></div>
            <span class="text-sm font-medium">5x5 Bingo Boards</span>
          </div>
          <div
            class="flex items-center gap-3 p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
          >
            <div class="h-2 w-2 rounded-full bg-orange-500"></div>
            <span class="text-sm font-medium">Mobile Friendly</span>
          </div>
        </div>
      </div>

      <!-- Right side - Auth form -->
      <div class="flex justify-center">
        <Card.Root class="w-full max-w-md">
          <Card.Header class="space-y-1">
            <Card.Title class="text-2xl text-center">
              {isLogin ? "Welcome back" : inviteToken ? "Join the Game" : "Create account"}
            </Card.Title>
            <Card.Description class="text-center">
              {isLogin
                ? "Sign in to continue playing"
                : inviteToken 
                ? "Create an account to accept your game invitation"
                : "Join the bingo fun on your cruise"}
            </Card.Description>
            
            {#if inviteToken && !isLogin}
              <div class="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-2">
                <p class="text-sm text-blue-800 dark:text-blue-200 text-center">
                  🎮 You're signing up to join a Cruise Bingo game!
                </p>
              </div>
            {/if}
          </Card.Header>

          <Card.Content>
            <form class="space-y-4" on:submit|preventDefault={handleSubmit}>
              {#if !isLogin}
                <div class="space-y-2">
                  <Label for="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    type="text"
                    required={!isLogin}
                    bind:value={displayName}
                    placeholder="Your display name"
                  />
                </div>
              {/if}

              <div class="space-y-2">
                <Label for="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  bind:value={email}
                  placeholder="name@example.com"
                />
              </div>

              <div class="space-y-2">
                <Label for="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  bind:value={password}
                  placeholder="Enter your password"
                />
              </div>

              {#if error}
                <div
                  class="p-3 rounded-md bg-destructive/15 border border-destructive/20"
                >
                  <p class="text-sm text-destructive">{error}</p>
                </div>
              {/if}

              <Button type="submit" disabled={loading} class="w-full" size="lg">
                {loading
                  ? "Please wait..."
                  : isLogin
                    ? "Sign In"
                    : "Create Account"}
              </Button>
            </form>
          </Card.Content>

          <Card.Footer>
            <Button variant="link" on:click={toggleMode} class="w-full">
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </Button>
          </Card.Footer>
        </Card.Root>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <footer class="p-4 text-center text-sm text-muted-foreground">
    <p>Perfect for cruise activities • Multiplayer bingo fun</p>
  </footer>
</div>

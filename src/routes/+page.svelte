<script>
	import { onMount } from "svelte";
    import snarkdown from "snarkdown";
    import "../app.css";

    let loading = $state(true);
    let experience = $state([]);
    let projects = $state([]);
    
    onMount(async () => {
        try {
            experience = await (await fetch("/experience.json")).json();
            projects = await (await fetch("/projects.json")).json();
        } catch (e) {
            console.error(e);
        }

        loading = false;
    });
</script>

<svelte:head>
	<link rel="icon" href="/portrait.png" />
	<title>Micah Baker</title>
</svelte:head>

<div class="w-screen py-8 sm:py-16 px-4 flex flex-col items-center justify-center">
    {#if loading}
        <div></div>
    {:else}
        <div class="flex flex-col gap-4 items-start justify-start">
            
            <!-- card -->
            
            <div class="flex flex-row gap-3 items-end justify-center">
                <img class="w-12 h-12 rounded-full" src="/portrait.png" alt="Portrait" />
                <div>
                    <h1 class="text-base font-bold">Micah Baker</h1>
                    <h2 class="text-sm text-slate-400">Software Developer</h2>
                </div>
            </div>

            <!-- contact/links -->

            <div class="grid grid-cols-[max-content_1fr] gap-x-4">
                <p class="text-xs">E-mail:</p>
                <a class="text-xs text-cyan-500 hover:text-cyan-700" href="mailto:micah_baker@sfu.ca">&lt;micah_baker@sfu.ca&gt;</a>
                <p class="text-xs">Github:</p>
                <a class="text-xs text-cyan-500 hover:text-cyan-700" href="https://github.com/micahdbak">@micahdbak</a>
                <p class="text-xs">LinkedIn:</p>
                <a class="text-xs text-cyan-500 hover:text-cyan-700" href="https://linkedin.com/in/micahdbak/">/in/micahdbak/</a>
            </div>

            <!-- education -->

            <h2 class="text-xs text-slate-400 mt-2">Education</h2>
            <div class="grid grid-cols-1 sm:grid-cols-[max-content_1fr] pl-4">
                <p class="text-xs">
                    <a class="text-cyan-500 hover:text-cyan-700" href="https://www.sfu.ca/">
                        Simon Fraser University
                    </a>,
                    BSc Computing Science
                </p>
                <p class="text-xs text-slate-500 ml-4">2027 Sep</p>
            </div>

            <!-- experience -->

            <h2 class="text-xs text-slate-400 mt-2">Experience</h2>

            <div class="grid grid-cols-1 sm:grid-cols-[max-content_1fr] w-full pl-4">
                {#each experience as exp}
                    <p class="text-xs">
                        <a class="text-cyan-500 hover:text-cyan-700" href="https://openwebui.com">
                            {exp.company}
                        </a>,
                        {exp.role}
                        <span class="text-slate-400">({exp.type})</span>
                    </p>
                    <p class="text-xs text-slate-500 ml-4">{exp.start} - {exp.end}</p>
                {/each}
            </div>

            <!-- projects -->

            <h2 class="text-xs text-slate-400 mt-2">Projects</h2>
            <div class="flex flex-col w-full gap-y-4">
                {#each projects as proj}
                    <div class="flex flex-col gap-y-1">
                        <div class="flex flex-col sm:flex-row justify-start items-start">
                            <p class="text-xs">
                                {proj.title}
                                ({#if proj.href}
                                    <a class="text-cyan-500 hover:text-cyan-700" href={proj.href}>
                                        {proj.alt}
                                    </a>,
                                    <a class="text-cyan-500 hover:text-cyan-700" href={proj.repo}>
                                        Github
                                    </a>)
                                {:else if proj.alt}
                                    <span class="text-cyan-600">
                                        {proj.alt}
                                    </span>,
                                    <a class="text-cyan-500 hover:text-cyan-700" href={proj.repo}>
                                        Github
                                    </a>)
                                {:else}
                                <a class="text-cyan-500 hover:text-cyan-700" href={proj.repo}>
                                    Github
                                </a>)
                                {/if}
                            </p>
                            <p class="text-xs text-slate-500 ml-4">{proj.start} - {proj.end}</p>
                        </div>
                        {#if proj.subtitle}
                            <p class="text-xs ml-4 text-slate-400 max-w-110">
                                {@html snarkdown(proj.subtitle).replaceAll(
                                    "<a href=", '<a class="text-cyan-400 hover:text-cyan-600" href=')}
                            </p>
                        {/if}
                        {#each proj.body as md}
                            <p class="text-xs ml-4 max-w-100">
                                {@html snarkdown(md).replaceAll(
                                    "<a href=", '<a class="text-cyan-500 hover:text-cyan-700" href=')}
                            </p>
                        {/each}
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>

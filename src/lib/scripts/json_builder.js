import { readFileSync, writeFileSync } from 'fs';
import fs from 'fs';

const quotesArray = [
	{
		quoteText: 'One lives perfectly well without technology',
		media: '',
		filename: '',
		timestamp: ''
	},
	{
		quoteText: "It's just more efficient",
		media: '',
		filename: '',
		timestamp: ''
	},
	{
		quoteText: "For academic work, honestly, it's not that useful",
		media: '',
		filename: '',
		timestamp: ''
	},
	{
		quoteText: 'Sometimes it feels too real',
		media: '',
		filename: '',
		timestamp: ''
	},
	{
		quoteText: "I don't like the illusion of talking to a person.",
		media: '',
		filename: '',
		timestamp: ''
	},
	{
		quoteText: 'which examines how skilled professionals utilize and',
		media: '',
		filename: '',
		timestamp: ''
	},
	{
		quoteText: 'Recruiting participants trained',
		media: '',
		filename: '',
		timestamp: ''
	},
	{
		quoteText:
			"I think for me, it's more like implementing something I've already set out. I did my research design, so I kind of mapped out the process of data collection or data analysis. It feels like I've already put the thought into how I wanted to do it, and then I just tell it [ChatGPT] to implement",
		media: '2025_03_17_AUDIO',
		filename: 'implementing_something.mp4',
		timestamp: '00:19:03:25 - 00:19:15:29'
	},
	{
		quoteText:
			'incredibly efficient, especially in the writing of [quantitative] social science essays since they tend to be standard in format',
		media: '',
		filename: '',
		timestamp: ''
	},
	{
		quoteText:
			"they're quite good when it comes to referencing with rigid guidelines. So if there's something really clear, like a formula for how to do referencing, for example, it usually can do that",
		media: '2025_03_17_AUDIO',
		filename: 'referencing_guidelines.mp4',
		timestamp: '00:52:51:09 - 00:53:18:28'
	},
	{
		quoteText:
			'I think one of the key things to get proper results is really to dissect every part of what you want to reflect on and go step by step. Because even if you give the big picture at the beginning and then try to break it down, it tends to try to do everything at once. I mean, it was really confused',
		media: '2025_03_17_AUDIO',
		filename: 'key_things_to_get.mp4',
		timestamp: '00:45:28:10 - 00:46:02:17'
	},
	{
		quoteText:
			"LLMs have difficulty following a progressive and logical approach over the long term. At first, I thought 'OK, law mostly relies on logic, and even on reasoning that's very close to mathematics, so LLMs could be really good at it'. But working with them showed me that it's often very hard for the machine to build on previous versions, to integrate feedback. And since my work required that kind of continuity, sometimes the long process became the most frustrating aspect of the project.",
		media: '2025_03_17_AUDIO',
		filename: 'difficulty_following.mp4',
		timestamp: '00:31:43:27 - 00:31:52:16'
	},
	{
		quoteText:
			"And I think the LLM doesn't really do that, because it responds to specific prompts and tasks. So when, at the end, you ask for a global answer, it struggles",
		media: '2025_03_17_AUDIO',
		filename: 'more_global_kind_of_reasoning.mp4',
		timestamp: '00:49:14:01 - 00:50:04:22'
	},
	{
		quoteText: 'I thought my work would be simple',
		media: '',
		filename: '',
		timestamp: ''
	},
	{
		quoteText:
			'I think it shows that law, even when it looks like a simple legal task, always contains hidden complexity.',
		media: '2025_03_17_AUDIO',
		filename: 'shows_that_law.mp4',
		timestamp: '00:32:17:28 - 00:32:25:13'
	},
	{
		quoteText:
			"Yeah, I think… Do you ever feel that too? Because I keep struggling with it, like… The window to put in the information and all the context just feels so small. Like, sometimes, you don't even know how to fit everything in. The struggle already starts with just trying to frame it",
		media: '2025_03_17_AUDIO',
		filename: 'do_you_ever_feel_that.mp4',
		timestamp: '00:50:08:06 - 00:50:26:27'
	},
	{
		quoteText:
			"creates noise in the response—like it's farther from what I actually want than if I just provide one document with a more precise question",
		media: '2025_03_17_AUDIO',
		filename: 'creates_noise.mp4',
		timestamp: '01:18:16:15 - 01:19:40:00'
	},
	{
		quoteText:
			"No, there's no joy in it—because I don't want to prompt the machine to do it. I just want the machine to do it. I don't want to have a role in the process. My ideal AI would be the one that automatically knows when to send an email, sends it, and just gets it out of my head",
		media: '2025_03_10_ZOOM_2.txt',
		filename: 'no_joy_in_it.mp4',
		timestamp: '00:18:12:04 - 00:20:09:20'
	},
	{
		quoteText:
			"I especially love [the] emotional stimuli [technique], because no matter the prompt, just adding 'this is very important for my work' already leads me to believe I put sufficient effort in maxing out the LLM",
		media: '',
		filename: '',
		timestamp: ''
	},
	{
		quoteText: 'a certain baseline of reference',
		media: '2025_03_17_AUDIO',
		filename: 'baseline_of_reference.mp4',
		timestamp: '01:06:35:27 - 01:06:53:17'
	},
	{
		quoteText:
			'I think I tend to do quite detailed prompts because I want the LLM to be effective. I really put a lot of information in it. When we did the first experiments with this group, I asked more general questions and I got a lot of hallucinations with ChatGPT.',
		media: '',
		filename: '',
		timestamp: ''
	},
	{
		quoteText: "such as you're a social media marketing expert",
		media: '',
		filename: '',
		timestamp: ''
	},
	{
		quoteText: "to make GPT-4 believe it's an expert on the topic",
		media: '',
		filename: '',
		timestamp: ''
	},
	{
		quoteText:
			"I didn't have the tools to understand the breakdown, and so I couldn't solve the problem",
		media: '',
		filename: '',
		timestamp: ''
	},
	{
		quoteText: "I just didn't really know what to say to it anymore",
		media: '',
		filename: '',
		timestamp: ''
	},
	{
		quoteText:
			"when the result is too general, and I don't know enough about the subject to ask more precise questions, I feel like I'm at a dead end, because I can't choose a new path of questions.",
		media: '',
		filename: '',
		timestamp: ''
	},
	{
		quoteText:
			'while it is difficult to determine whether it actually improves the outputs [...], it leads me to believe I put sufficient effort in maxing out the LLM',
		media: '',
		filename: '',
		timestamp: ''
	},
	{
		quoteText:
			"I thought I could kind of adjust how it worked. But in the end, I found that the more I tried to get a precise formulation, the more random the results became. I had this experience while trying to get it to use one specific word, 'populism', and the more I pushed for that, the weirder the answers got. I had no way of knowing how to influence the outcome. So it gave me this kind of feeling of absurdity, which was surprising, because I actually expected the opposite by the end of the experiments.",
		media: '2025_03_17_AUDIO',
		filename: 'could_kind_of.mp4',
		timestamp: '01:39:05:25 - 01:39:46:11'
	},
	{
		quoteText:
			"There's this moment when I realize, after giving multiple instructions, clarifying, or rephrasing, that ChatGPT is giving me completely off-topic information. I end up feeling really frustrated and give up, out of lack of time and motivation. [...] ChatGPT just doesn't understand what I asked, despite all my efforts",
		media: '',
		filename: '',
		timestamp: ''
	},
	{
		quoteText:
			'The archive traces the evolving relationship between users and LLMs through a series of scenes, each',
		media: '',
		filename: '',
		timestamp: ''
	},
	{
		quoteText:
			"The most difficult part of legal reasoning is reformulating. When you have a client coming in with a question that's all over the place, and you have to figure out what the actual problem is, and then explain it. And with the LLM, it was kind of the same, because we always had to explain it again. You can't really assume that you're talking to a lawyer",
		media: '2025_03_17_AUDIO',
		filename: 'most_difficult_part.mp4',
		timestamp: '00:40:36:06 - 00:41:12:02'
	},
	{
		quoteText: 'revise her emails five times',
		media: '2025_03_17_AUDIO',
		filename: '',
		timestamp: ''
	},
	{
		quoteText: 'Colleagues make mistakes too, so how are they different from ChatGPT?', //redo
		media: '2025_03_17_AUDIO',
		filename: 'colleagues_make_mistakes.mp4',
		timestamp: '01:50:59:16 - 01:51:36:16'
	},
	{
		quoteText:
			"I think I distrust the machine more, and maybe I'm just biased, because it's probabilistic—I really don't think it understands. But if it's a colleague or an intern, that person can still learn, and you can actually teach them how to do it",
		media: '2025_03_17_AUDIO',
		filename: 'distrust_the_machine.mp4',
		timestamp: '01:51:37:16 - 01:52:16:04'
	},
	{
		quoteText:
			"It's kind of a tool you can use anytime, day or night. So you develop a certain kind of interpersonal relationship with the LLM, and it feels safe to ask it any question, even the kind of question you might feel stupid asking someone else. You don't feel like you're going to be judged afterward, even if you say something dumb",
		media: '2025_03_10_ZOOM_2.txt',
		filename: 'it_kind_of_a_tool.mp4',
		timestamp: '00:59:09:26 - 01:00:55:22'
	},
	{
		quoteText:
			"I always feel a bit weird telling people that I still write myself notes before making a phone call. It's like, yeah, maybe in the professional world there's this kind of judgment. Like, you can't even make a call without prepping? So that's why it feels lower stakes to do it with something like ChatGPT than to just do it on my own. I could do it myself, but it would take a lot of time. And I'd probably feel a bit guilty spending so much time on a task that, in the end, maybe I don't even need, because I often don't even look at the notes that much. But because it gives me a sense of security, and because it's fast with ChatGPT, it kind of resolves that tension",
		media: '2025_03_17_AUDIO',
		filename: 'bit_weird.mp4',
		timestamp: '01:09:04:22 - 01:09:18:27'
	},
	{
		quoteText:
			"I think throughout all the practice, I really found myself gravitating toward some boring tasks—like we all did. Things I don't really enjoy, and that often take up way too much time, things I don't actually want to spend time on. For me, that's usually paraphrasing.",
		media: '2025_03_17_AUDIO',
		filename: 'myself_gravitating.mp4',
		timestamp: '00:52:26:04 - 00:52:43:02'
	},
	{
		quoteText:
			"A large part of our time as economists is spent on really uninteresting tasks. That's probably why economists have so many research assistants [laughter]. And also, the profession is relying more and more on heavy tools that require tons of annotation, data cleaning, and all that. Which means less time for more theoretical or analytical tasks. So, in theory, LLMs could help gain time for that. But in practice, I don't think that's what's happening.  Because now that we can do more complex things with machines, we end up pushing the tools even further. And in the end, I don't think we actually spend more time trying to really understand the mechanisms at stake. We just want a fancy method that will impress people. [...] So it's true, it expands possibilities a lot for economists. But is that really what we should be doing? I don't know. Maybe it's not where our discipline is the most valuable",
		media: '2025_03_17_AUDIO',
		filename: 'large_part_of_our_time.mp4',
		timestamp: '01:21:46:16 - 01:22:33:16'
	},
	{
		quoteText:
			"Before [using the LLM], I used to do those tasks already, I didn't have more or less work. It just wasn't boring. I mean, I didn't think of it as something super interesting, but it wasn't boring either. And with the use of the LLM, it started to feel more and more boring. [...] It's not just that it revealed something [about my work], but somehow, the way we use it creates the boredom",
		media: '2025_03_10_ZOOM_2.txt',
		filename: 'before_using_the_llm.mp4',
		timestamp: '00:37:49:19 - 00:38:37:09'
	},
	{
		quoteText:
			"And I think that's why I have some issues with the work I'm producing, because I feel like I'm just an interface for code that's already been written. But sometimes it's kind of rewarding when you see that you've managed to produce the numbers. [...] So I'm happy when I get the final results. But in the meantime, during those long days of doing it, I don't really feel very accomplished, I'd say. Whereas I remember, when I was starting to code without ChatGPT, every time I managed to do something, it felt like a real event",
		media: '2025_03_17_AUDIO',
		filename: 'some_issues_with_the_work.mp4',
		timestamp: '01:34:48:16 - 01:35:06:16'
	},
	{
		quoteText: 'The machine is now part of my daily life, whether I use it or not',
		media: '',
		filename: '',
		timestamp: ''
	},
	{
		quoteText:
			"I have a very short deadline, like a month and a half, and I'm super, super late for work. [...] I'm trying not to let the time pressure get to me. I tell myself, 'No, I'll take the time I need, even if it means some parts are less developed.' I'm trying not to be a perfectionist, trying not to do everything all at once",
		media: '2025_03_17_AUDIO',
		filename: 'short_deadline.mp4',
		timestamp: '01:43:06:17 - 01:44:04:18'
	},
	{
		quoteText:
			"So you're trying to set boundaries for your work, based on what you as a human are capable of doing?",
		media: '2025_03_17_AUDIO',
		filename: 'boundaries_for_your_work.mp4',
		timestamp: '01:44:04:18 - 01:44:11:16'
	},
	{
		quoteText:
			"Yeah, boundaries for my work, for my topic, and also for which tasks I do myself and which ones I might do with ChatGPT. But it's a slippery slope. Initially, I didn't want to use it at all. However, I then got stuck on some sociological concepts, and my advisor couldn't help, so I asked GPT. And because it worked, I used it to look for literature. Since that worked, I would like to use it for a literature review. And I'm trying not to. But because it works, it's hard not to. Still, I don't want to be productive just for the sake of productivity. I just want to do good work",
		media: '2025_03_17_AUDIO',
		filename: 'boundaries_for_my_work.mp4',
		timestamp: '01:44:12:16 - 01:44:53:04'
	}
];

const parseSrt = (srt) => {
	const cues = [];
	const lines = srt.split(/\r?\n/);
	let i = 0;

	while (i < lines.length) {
		// skip cue index line (e.g. "12")
		if (!/^\d+$/.test(lines[i].trim())) {
			i++;
			continue;
		}
		i++; // move to timestamp line

		// match “hh:mm:ss,ms --> hh:mm:ss,ms”
		const m = (lines[i] || '').match(
			/(\d{2}:\d{2}:\d{2}),(\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}),(\d{3})/
		);
		if (!m) {
			i++;
			continue;
		}
		const start = `${m[1]}.${m[2]}`; // 00:00:00,233 → 00:00:00.233
		const end = `${m[3]}.${m[4]}`;

		i++; // move to first text line
		const buf = [];
		while (i < lines.length && lines[i].trim() !== '') {
			buf.push(lines[i].trim());
			i++;
		}
		cues.push({ start, end, text: buf.join(' ') });
		i++; // skip the blank line
	}
	return cues;
};

const lcsLength = (a, b) => {
	if (!a.length || !b.length) {
		return 0;
	}
	const m = a.length;
	const n = b.length;
	const dp = Array(m + 1)
		.fill(0)
		.map(() => Array(n + 1).fill(0));

	for (let i = 1; i <= m; i++) {
		for (let j = 1; j <= n; j++) {
			if (a[i - 1] === b[j - 1]) {
				dp[i][j] = dp[i - 1][j - 1] + 1;
			} else {
				dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
			}
		}
	}
	return dp[m][n];
};

const parseTime = (timeString) => {
	const [hours, minutes, seconds] = timeString.split(':');
	const [secs, millisecs] = seconds.split('.');
	return (
		(parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(secs)) * 1000 + parseInt(millisecs)
	);
};

const baseTxt = fs.readFileSync('src/lib/media/narratio_debug.srt', 'utf8');
const baseJson = parseSrt(baseTxt);
const finalJson = [];

baseJson.forEach((segment) => {
	const startMs = parseTime(segment.start);
	const endMs = parseTime(segment.end);
	const duration = endMs - startMs;

	segment.start = startMs; // keep absolute start time in ms
	segment.end = endMs; // keep absolute end time in ms
	segment.duration = duration;

	const segmentWords = segment.text
		.toLowerCase()
		.replace(/[^\w\s]/g, '')
		.split(/\s+/)
		.filter(Boolean);

	const q = quotesArray.find((qu) => {
		if (!qu.filename || segmentWords.length === 0) {
			return false;
		}
		const quoteWords = qu.quoteText
			.toLowerCase()
			.replace(/[^\w\s]/g, '')
			.split(/\s+/)
			.filter(Boolean);

		const len = lcsLength(segmentWords, quoteWords);
		const score = len / segmentWords.length;

		return score >= 0.8;
	});

	if (q) {
		segment.media = 'video_quote_static/' + q.filename;
		segment.type = 'quote';
		//segment.text = "" + q.quoteText + "";
		console.log(`Matched caption "${segment.text}"`);
	} else {
		segment.media = '';
		segment.type = 'random';
		console.log(`No match for caption "${segment.text}"`);
	}
});

if (baseJson.length > 0) {
	finalJson.push(baseJson[0]);

	for (let i = 1; i < baseJson.length; i++) {
		const last = finalJson[finalJson.length - 1];
		const current = baseJson[i];
		if (last.type === 'quote' && current.type === 'quote' && last.media === current.media) {
			// merge consecutive captions from same quote: keep original start, extend end
			last.end = current.end;
			last.duration = last.end - last.start;
			last.text += ' ' + current.text;
		} else {
			finalJson.push(current);
		}
	}
}

if (finalJson) {
	try {
		const newJson = JSON.stringify(finalJson, null, 2);
		fs.writeFileSync('src/lib/media/newJson.json', newJson, 'utf8');
	} catch (error) {
		console.error('Error writing file:', error);
	} finally {
		console.log('✅ newJson was correctly saved');
	}
}

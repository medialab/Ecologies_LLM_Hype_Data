const introImages = import.meta.glob(
	'../../lib/media/0_INTRO/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp,svg}',
	{
		eager: false,
		query: {
			enhanced: true
		}
	}
);

const septemberOctoberImages = import.meta.glob(
	'../../lib/media/1_SEPTEMBER_OCTOBER/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp,svg}',
	{
		eager: false,
		query: {
			enhanced: true
		}
	}
);

const septemberOctoberVideos = import.meta.glob(
	'../../lib/media/1_SEPTEMBER_OCTOBER/*.{webm,mp4,mov}',
	{
		eager: true
	}
);

// 2_NOVEMBER_DECEMBER media
const novemberDecemberImages = import.meta.glob(
	'../../lib/media/2_NOVEMBER_DECEMBER/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp,svg}',
	{
		eager: false,
		query: {
			enhanced: true
		}
	}
);

const novemberDecemberVideos = import.meta.glob(
	'../../lib/media/2_NOVEMBER_DECEMBER/*.{webm,mp4,mov}',
	{
		eager: true
	}
);

const januaryImages = import.meta.glob(
	'../../lib/media/3_JANUARY/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp,svg}',
	{
		eager: false,
		query: {
			enhanced: true
		}
	}
);

const januaryVideos = import.meta.glob('../../lib/media/3_JANUARY/*.{webm,mp4,mov}', {
	eager: true
});

const februaryImages = import.meta.glob(
	'../../lib/media/4_FEBRUARY/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp,svg}',
	{
		eager: false,
		query: {
			enhanced: true
		}
	}
);

const februaryVideos = import.meta.glob('../../lib/media/4_FEBRUARY/*.{webm,mp4,mov}', {
	eager: true
});

// 4_MARCH_APRIL media
const marchAprilImages = import.meta.glob(
	'../../lib/media/5_MARCH_APRIL/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp,svg}',
	{
		eager: false,
		query: {
			enhanced: true
		}
	}
);

const marchAprilVideos = import.meta.glob('../../lib/media/5_MARCH_APRIL/*.{webm,mp4,mov}', {
	eager: true
});

// Helper to exclude macOS "_" resource fork files and handle lazy-loaded modules
async function filterGlob(globResult) {
	const entries = Object.entries(globResult)
		.filter(([filePath]) => !filePath.split('/').pop().startsWith('._'))
		.sort((a, b) => a[0].localeCompare(b[0]));

	const modules = await Promise.all(
		entries.map(async ([, loader]) => {
			if (typeof loader === 'function') {
				return await loader();
			}
			return loader;
		})
	);

	return modules;
}

export async function GET({ url }) {
	const period = url.searchParams.get('period');

	console.log('API called with period:', period);

	if (!period) {
		return new Response(JSON.stringify({ error: 'Period parameter is required' }), {
			status: 400,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}

	// Validate period parameter against allowed values
	const allowedPeriods = [
		'intro',
		'september_october',
		'november_december',
		'january',
		'february',
		'march_april'
	];
	if (!allowedPeriods.includes(period)) {
		return new Response(JSON.stringify({ error: 'Invalid period specified' }), {
			status: 400,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}

	let images, videos;

	switch (period) {
		case 'intro':
			images = await filterGlob(introImages);
			videos = null;
			break;

		case 'september_october':
			images = await filterGlob(septemberOctoberImages);
			videos = await filterGlob(septemberOctoberVideos);
			break;

		case 'november_december':
			images = await filterGlob(novemberDecemberImages);
			videos = await filterGlob(novemberDecemberVideos);
			break;

		case 'january':
			images = await filterGlob(januaryImages);
			videos = await filterGlob(januaryVideos);
			break;

		case 'february':
			images = await filterGlob(februaryImages);
			videos = await filterGlob(februaryVideos);
			break;

		case 'march_april':
			images = await filterGlob(marchAprilImages);
			videos = await filterGlob(marchAprilVideos);
			break;
		default:
			return new Response(JSON.stringify({ error: 'Invalid period specified' }), {
				status: 400,
				headers: {
					'Content-Type': 'application/json'
				}
			});
	}

	const result = {
		images,
		videos
	};

	return new Response(JSON.stringify(result), {
		headers: {
			'Content-Type': 'application/json'
		}
	});
}

// 1_SEPTEMBER media

const septImages = import.meta.glob(
	'../../lib/media/1_SEPTEMBER/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp,svg}',
	{
		eager: true
	}
);

const septVideos = import.meta.glob('../../lib/media/1_SEPTEMBER/**/*.{webm,mp4,mov}', {
	eager: true
});

const septConvs = import.meta.glob('../../lib/media/1_SEPTEMBER/**/*.json', { eager: true });

// 2_OCTOBER_NOVEMBER media
const octNovImages = import.meta.glob(
	'../../lib/media/2_OCTOBER_NOVEMBER/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp,svg}',
	{
		eager: true
	}
);

const octNovVideos = import.meta.glob('../../lib/media/2_OCTOBER_NOVEMBER/**/*.{webm,mp4,mov}', {
	eager: true
});

const octNovConvs = import.meta.glob('../../lib/media/2_OCTOBER_NOVEMBER/**/*.json', {
	eager: true
});

// 3_DECEMBER_JANUARY media
const decJanImages = import.meta.glob(
	'../../lib/media/3_DECEMBER_JANUARY/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp,svg}',
	{
		eager: true
	}
);

const decJanVideos = import.meta.glob('../../lib/media/3_DECEMBER_JANUARY/**/*.{webm,mp4,mov}', {
	eager: true
});

const decJanConvs = import.meta.glob('../../lib/media/3_DECEMBER_JANUARY/**/*.json', {
	eager: true
});

// 4_FEBRUARY media
const febImages = import.meta.glob(
	'../../lib/media/4_FEBRUARY/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp,svg}',
	{
		eager: true
	}
);

const febVideos = import.meta.glob('../../lib/media/4_FEBRUARY/**/*.{webm,mp4,mov}', {
	eager: true
});

const febConvs = import.meta.glob('../../lib/media/4_FEBRUARY/**/*.json', { eager: true });

// 5_MARCH media
const marImages = import.meta.glob(
	'../../lib/media/5_MARCH/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp,svg}',
	{
		eager: true
	}
);

const marVideos = import.meta.glob('../../lib/media/5_MARCH/**/*.{webm,mp4,mov}', {
	eager: true
});

const marConvs = import.meta.glob('../../lib/media/5_MARCH/**/*.json', { eager: true });

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

	let images, videos, convs;

	switch (period) {
		case 'intro':
			images = null;
			videos = null;
			convs = null;

			break;
		case 'september':
			images = Object.values(septImages);
			videos = Object.values(septVideos);
			convs = Object.values(septConvs);

			break;
		case 'october_november':
			images = Object.values(octNovImages);
			videos = Object.values(octNovVideos);
			convs = Object.values(octNovConvs);

			break;
		case 'december_january':
			images = Object.values(decJanImages);
			videos = Object.values(decJanVideos);
			convs = Object.values(decJanConvs);

			break;
		case 'february':
			images = Object.values(febImages);
			videos = Object.values(febVideos);
			convs = Object.values(febConvs);

			break;
		case 'march':
			images = Object.values(marImages);
			videos = Object.values(marVideos);
			convs = Object.values(marConvs);

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
		videos,
		convs
	};

	return new Response(JSON.stringify(result), {
		headers: {
			'Content-Type': 'application/json'
		}
	});
}

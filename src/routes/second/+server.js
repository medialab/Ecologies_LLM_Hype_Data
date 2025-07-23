// 1_SEPTEMBER_OCTOBER media

const septemberOctoberImages = import.meta.glob(
	'../../lib/media/1_SEPTEMBER_OCTOBER/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp,svg}',
	{
		eager: true
	}
);

const septemberOctoberVideos = import.meta.glob('../../lib/media/1_SEPTEMBER_OCTOBER/**/*.{webm,mp4,mov}', {
	eager: true
});

const septemberOctoberConvs = import.meta.glob('../../lib/media/1_SEPTEMBER_OCTOBER/**/*.json', { eager: true });

// 2_NOVEMBER_DECEMBER media
const novemberDecemberImages = import.meta.glob(
	'../../lib/media/2_NOVEMBER_DECEMBER/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp,svg}',
	{
		eager: true
	}
);

const novemberDecemberVideos = import.meta.glob('../../lib/media/2_NOVEMBER_DECEMBER/**/*.{webm,mp4,mov}', {
	eager: true
});

const novemberDecemberConvs = import.meta.glob('../../lib/media/2_NOVEMBER_DECEMBER/**/*.json', {
	eager: true
});

// 3_JANUARY_FEBRUARY media
const januaryFebruaryImages = import.meta.glob(
	'../../lib/media/3_JANUARY_FEBRUARY/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp,svg}',
	{
		eager: true
	}
);

const januaryFebruaryVideos = import.meta.glob('../../lib/media/3_JANUARY_FEBRUARY/**/*.{webm,mp4,mov}', {
	eager: true
});

const januaryFebruaryConvs = import.meta.glob('../../lib/media/3_JANUARY_FEBRUARY/**/*.json', {
	eager: true
});

// 4_MARCH_APRIL media
const marchAprilImages = import.meta.glob(
	'../../lib/media/4_MARCH_APRIL/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp,svg}',
	{
		eager: true
	}
);

const marchAprilVideos = import.meta.glob('../../lib/media/4_MARCH_APRIL/**/*.{webm,mp4,mov}', {
	eager: true
});

const marchAprilConvs = import.meta.glob('../../lib/media/4_MARCH_APRIL/**/*.json', { eager: true });

// Helper to exclude macOS “._” resource fork files
function filterGlob(globResult) {
	return Object.entries(globResult)
		.filter(([filePath]) => !filePath.split('/').pop().startsWith('._'))
		.map(([, module]) => module);
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

	let images, videos, convs;

	switch (period) {
		case 'intro':
			images = null;
			videos = null;
			convs = null;
			break;

		case 'september_october':
			images = filterGlob(septemberOctoberImages);
			videos = filterGlob(septemberOctoberVideos);
			convs = filterGlob(septemberOctoberConvs);
			break;

		case 'november_december':
			images = filterGlob(novemberDecemberImages);
			videos = filterGlob(novemberDecemberVideos);
			convs = filterGlob(novemberDecemberConvs);
			break;

		case 'january_february':
			images = filterGlob(januaryFebruaryImages);
			videos = filterGlob(januaryFebruaryVideos);
			convs = filterGlob(januaryFebruaryConvs);
			break;

		case 'march_april':
			images = filterGlob(marchAprilImages);
			videos = filterGlob(marchAprilVideos);
			convs = filterGlob(marchAprilConvs);
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

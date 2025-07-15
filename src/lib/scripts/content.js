export const randomImages = import.meta.glob(
    '../media/random/*.{avif,gif,heif,jpeg,jpg,png,tiff,webp,svg}',
    {
        eager: true,
        query: {
            enhanced: true
        }
    },
)

export const randomVideos = import.meta.glob(
    '../media/random/*.{webm,mp4,mov}',
    {
        eager: true,
    }
)

export const randomConvs = import.meta.glob('../media/random/*.json', { eager: true })

console.log("randomConvs", randomConvs);
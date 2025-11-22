// app/public-videos/page.tsx

export default async function PublicVideosPage() {
  // const videos = await prisma.userMedia.findMany({
  //   where: {
  //     visibility: 'PUBLIC',
  //     deletedAt: null,
  //   },
  //   select: {
  //     id: true,
  //     name: true,
  //     description: true,
  //     url: true,
  //     posterUrl: true,
  //     createdAt: true,
  //     transcripts: {
  //       where: { isCurrent: true },
  //       select: {
  //         text: true,
  //       },
  //       take: 1,
  //     },
  //   },
  //   orderBy: { createdAt: 'desc' },
  // });

  // const typedVideos = videos.map((video) => ({
  //   id: video.id,
  //   name: video.name || 'Untitled Video',
  //   description: video.description || '',
  //   url: video.url || '',
  //   posterUrl: video.posterUrl,
  //   createdAt: video.createdAt,
  //   // transcript: video.transcripts[0]?.text || '',
  // }));

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Public Videos</h1>
        <p className="text-gray-600">Browse videos shared by the community</p>
      </div>
      {/* <PublicVideosList videos={typedVideos} /> */}
    </div>
  );
}

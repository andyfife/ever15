import Image from 'next/image';
import team from './data/team.json';

export default function OurTeam() {
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <h1 className="text-4xl mb-2 text-orange-500">OUR TEAM</h1>

      <ul className=" grid grid-cols-1 sm:grid-cols-2 gap-8">
        {team.map((member) => (
          <li
            key={member.id}
            className="flex flex-col items-center text-center p-4 border rounded-xl shadow-sm"
          >
            <Image
              src={`/images/team/${member.image || 'avatar-placeholder.png'}`}
              alt={member.name}
              width={150}
              height={150}
              className="rounded-md mb-4"
            />
            <h2 className="text-2xl font-semibold">{member.name}</h2>
            <p className="text-xl text-gray-600">{member.role}</p>
            <p className="mt-2 text-gray-700 text-sm">{member.bio}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

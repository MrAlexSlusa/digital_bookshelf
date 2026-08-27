export default function GradeStars({ grade }) {
  if (grade === null || grade === undefined || grade === '') {
    return <span className="grade-stars grade-stars--empty">Not graded</span>;
  }
  const value = Number(grade);
  const fullStars = Math.round(value / 2); // grade is 0-10, show out of 5 stars
  return (
    <span className="grade-stars" title={`${value}/10`}>
      {'★'.repeat(fullStars)}
      {'☆'.repeat(5 - fullStars)}
      <span className="grade-stars__num">{value}/10</span>
    </span>
  );
}

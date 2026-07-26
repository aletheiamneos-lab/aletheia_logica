import { Navigate, useParams } from "react-router-dom"

function LessonDetailPage() {
  const { lessonId } = useParams()
  return <Navigate replace to={`/lectii/${lessonId}/teorie`} />
}

export default LessonDetailPage

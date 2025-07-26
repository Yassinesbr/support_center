// import { useParams } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
// import StudentProfile from "../../components/StudentProfile/StudentProfile";
import UserAddressCard from "../../components/UserProfile/UserAddressCard";
import UserInfoCard from "../../components/UserProfile/UserInfoCard";
import UserMetaCard from "../../components/UserProfile/UserMetaCard";
// import { useStudentProfile } from "../../hooks/useStudentProfile";

export default function StudentProfilePage() {
  // const { studentId } = useParams();
  // const { data, isLoading, error } = useStudentProfile(Number(studentId));

  // if (isLoading) return <div>Loading...</div>;
  // if (error) return <div>Error loading student profile.</div>;
  // if (!data) return <div>No student found.</div>;
  return (
    <>
      <PageMeta
        title="React.js Basic Tables Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Basic Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Students Profile" />
      <div className="space-y-6">
        <div className="space-y-6">
          <UserMetaCard />
          <UserInfoCard />
          <UserAddressCard />
        </div>
      </div>
    </>
  );
}

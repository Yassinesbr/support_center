import { useParams } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import UserAddressCard from "../../components/UserProfile/UserAddressCard";
import UserInfoCard from "../../components/UserProfile/UserInfoCard";
import UserMetaCard from "../../components/UserProfile/UserMetaCard";
import { useStudentProfile } from "../../hooks/useStudentProfile";
import Loader from "../../components/Loader/Loader";

export default function StudentProfilePage() {
  const { studentId } = useParams();
  const { data, isLoading, error } = useStudentProfile(studentId);
  if (isLoading)
    return (
      <div>
        <Loader />
      </div>
    );

  if (error) return <div>Error loading students.</div>;
  if (!data) return <div>No student found.</div>;
  return (
    <>
      <PageMeta
        title="React.js Basic Tables Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Basic Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Students Profile" />
      <div className="space-y-6">
        <div className="space-y-6">
          <UserMetaCard
            studentId={data.id}
            firstName={data.user.firstName}
            lastName={data.user.lastName}
            email={data.user.email}
            profilePicture={data.user.image}
            phoneNumber={data.phone}
            profileAddress={data.address}
          />
          <UserInfoCard
            firstName={data.user.firstName}
            lastName={data.user.lastName}
            email={data.email}
            birthDate={data.birthDate}
            phone={data.phone}
            parentName={data.parentName}
            parentPhone={data.parentPhone}
            enrollmentDate={data.enrollmentDate}
            paymentStatus={data.paymentStatus}
          />
          <UserAddressCard address={data.address} />
        </div>
      </div>
    </>
  );
}

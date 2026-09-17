import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import {
  FiPlus,
  FiEye,
  FiEdit,
  FiTrash2,
  FiLayers,
  FiCheckCircle,
  FiClock,
} from "react-icons/fi";

import useAxiosSecure from "../../hooks/useAxiosSecure";


const LandingPages = () => {


  const axiosSecure = useAxiosSecure();


  const [deletingId, setDeletingId] = useState(null);



  const {
    data: pages = [],
    isLoading,
    refetch,

  } = useQuery({

    queryKey:["landing-pages"],


    queryFn:async()=>{

      const res =
      await axiosSecure.get(
        "/api/landing-pages"
      );


      return res.data.data || res.data;

    }

  });






  const handleDelete = async(id)=>{


    const confirmDelete =
    window.confirm(
      "Are you sure you want to delete this landing page?"
    );


    if(!confirmDelete) return;



    try{


      setDeletingId(id);



      await axiosSecure.delete(
        `/api/landing-pages/${id}`
      );



      alert(
        "Landing page deleted successfully"
      );



      refetch();



    }catch(error){


      console.log(error);


      alert(
        error.response?.data?.message ||
        "Delete failed"
      );


    }finally{


      setDeletingId(null);


    }



  };







  const stats={


    total:pages.length,


    published:
    pages.filter(
      p=>p.status==="published"
    ).length,


    draft:
    pages.filter(
      p=>p.status==="draft"
    ).length,


  };







  if(isLoading){


    return(

      <div className="
      flex
      justify-center
      items-center
      h-60
      text-slate-500
      ">

      Loading Landing Pages...

      </div>

    );


  }






return (


<div className="
p-5
md:p-8
space-y-8
bg-slate-50
min-h-screen
">






{/* HEADER */}



<div className="
flex
justify-between
items-center
">


<div>

<h1 className="
text-3xl
font-bold
text-slate-900
">

Landing Pages

</h1>


<p className="
text-slate-500
mt-1
">

Create high converting product sales pages

</p>


</div>





<Link

to="/dashboard/landing-pages/create"

className="
flex
items-center
gap-2
bg-blue-600
hover:bg-blue-700
text-white
px-5
py-3
rounded-xl
font-semibold
shadow
"

>

<FiPlus/>

Create Landing Page


</Link>



</div>








{/* STATS */}



<div className="
grid
grid-cols-1
md:grid-cols-3
gap-5
">



<div className="
bg-white
rounded-2xl
p-5
shadow-sm
border
flex
items-center
gap-4
">


<div className="
p-4
bg-blue-100
text-blue-600
rounded-xl
">

<FiLayers size={25}/>

</div>


<div>

<p className="text-slate-500 text-sm">
Total Pages
</p>


<h2 className="text-2xl font-bold">

{stats.total}

</h2>

</div>


</div>





<div className="
bg-white
rounded-2xl
p-5
shadow-sm
border
flex
items-center
gap-4
">


<div className="
p-4
bg-green-100
text-green-600
rounded-xl
">

<FiCheckCircle size={25}/>

</div>


<div>

<p className="text-slate-500 text-sm">
Published
</p>


<h2 className="text-2xl font-bold">

{stats.published}

</h2>

</div>


</div>






<div className="
bg-white
rounded-2xl
p-5
shadow-sm
border
flex
items-center
gap-4
">


<div className="
p-4
bg-yellow-100
text-yellow-600
rounded-xl
">

<FiClock size={25}/>

</div>


<div>

<p className="text-slate-500 text-sm">
Draft
</p>


<h2 className="text-2xl font-bold">

{stats.draft}

</h2>

</div>


</div>




</div>









{/* CARDS */}



<div className="
grid
grid-cols-1
lg:grid-cols-2
gap-6
">





{
pages.map((page)=>(


<div

key={page._id}

className="
bg-white
rounded-2xl
border
shadow-sm
p-5
hover:shadow-md
transition
"

>




<div className="
flex
gap-5
">


<div className="
w-32
h-32
rounded-xl
overflow-hidden
bg-slate-100
shrink-0
">


<img

src={
page.hero?.image ||
page.product?.productImage?.[0]
}

className="
w-full
h-full
object-cover
"

/>


</div>







<div className="
flex-1
">


<div className="
flex
justify-between
gap-2
">


<h2 className="
font-bold
text-lg
line-clamp-1
">

{page.title}

</h2>




<span className={`

px-3
py-1
rounded-full
text-xs
font-semibold


${
page.status==="published"

?
"bg-green-100 text-green-700"

:

"bg-yellow-100 text-yellow-700"

}

`}>

{page.status}

</span>



</div>





<p className="
text-sm
text-slate-500
mt-2
">

{
page.product?.productName ||
"Product"
}

</p>




<div className="
flex
items-center
gap-2
mt-4
text-sm
text-slate-500
">

<FiEye/>

{page.views || 0}

</div>



</div>




</div>







<div className="
border-t
mt-5
pt-4
flex
justify-end
gap-3
">






<Link

to={`/lp/${page.slug}`}

target="_blank"

className="
px-4
py-2
rounded-lg
bg-slate-100
text-slate-700
flex
items-center
gap-2
hover:bg-slate-200
"

>

<FiEye/>

Preview

</Link>








<Link

to={`/dashboard/landing-pages/edit/${page._id}`}

className="
px-4
py-2
rounded-lg
bg-blue-600
text-white
flex
items-center
gap-2
"

>

<FiEdit/>

Edit

</Link>









<button

onClick={()=>
handleDelete(page._id)
}

disabled={
deletingId===page._id
}


className="
px-4
py-2
rounded-lg
bg-red-50
text-red-600
flex
items-center
gap-2
disabled:opacity-50
"

>


<FiTrash2/>


{
deletingId===page._id

?
"Deleting..."

:

"Delete"

}



</button>








</div>






</div>


))


}



</div>





</div>


);


};


export default LandingPages;
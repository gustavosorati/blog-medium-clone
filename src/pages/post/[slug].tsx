/* eslint-disable @next/next/no-img-element */
import { GetStaticPaths, GetStaticProps } from "next";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import PortableText from "react-portable-text";
import { Post as IPost } from '../../@types/sanity';
import { Header } from "../../components/Header";
import { sanityClient, urlFor } from "../../lib/sanity";

interface IFormInput {
  _id: string;
  name: string;
  email: string;
  comment: string;
}

interface Props {
  post: IPost
}



export default function Post({post}: Props) {
  console.log(post.comments)
const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState: {errors}} = useForm<IFormInput>()

  const onSubmit: SubmitHandler<IFormInput> = async(data) => {
    await fetch("/api/createComment", {
      method: 'POST',
      body: JSON.stringify(data)
    }).then(() => {
      console.log(data);
      setSubmitted(true);
    }). catch((err) => {
      console.log(err);
      setSubmitted(false);
    });
  }

  return (
    <main>
      <Header />

      <img 
        className="w-full h-40 object-cover"
        src={urlFor(post.mainImage).url()} 
        alt=""
      />

      <article className="max-w-3xl mx-auto p-5">
        <h1 className="text-3xl mt-10 mb-3">{post.title}</h1>
        <h2 className="text-xl font-light text-gray-500 mb-2">{post.description}</h2>

        <div className="flex items-center space-x-2">
          <img 
            className="w-10 h-10 rounded-full"
            src={urlFor(post.author.image).url()!} 
            alt=""
          />
          <p className="font-extralight text-sm">Blog pos bt <span className="text-green-600">{post.author.name}</span> - Published at {new Date(post._createdAt).toLocaleDateString()}</p>
        </div>

        <div className="mt-10">
          <PortableText
            className=""
            dataset={process.env.NEXT_PUBLIC_SANITY_DATASET!}
            projectId={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!}
            content={post.body}
            serializers={
              {
                h1: (props: any) => (
                  <h1 className="text-2xl font-bold my-5" {...props} />
                ),
                h2: (props: any) => (
                  <h1 className="text-xl font-bold my-5" {...props} />
                ),
                li: ({children}: any) => (
                  <li className="ml-4 list-disc">{children}</li>
                ),
                link: ({href, children}: any) => (
                  <a href={href} className="text-blue-500 hover:underline">
                    {children}
                  </a>
                ),
              }
            }
          />
        </div>
      </article>

      <hr className="max-w-lg my-5 mx-auto border border-yellow-500"/>
      
      {submitted ? (
        <div className="flex flex-col max-w-2xl mx-auto p-10 my-10 bg-yellow-500">
          <h3 className="text-3xl font-bold">Thank you for submitting your comment!</h3>
          <p>Once it has been approved, it will appear on bellow!</p>
        </div>
      ): (
        <form className="flex flex-col p-5 max-w-2xl mx-auto mb-10" onSubmit={handleSubmit(onSubmit)}>
        <h3 className="text-sm text-yellow-500">Enjoyed this article?</h3>
        <h4 className="text-3xl font-bold">Leave a comment bellow!</h4>
        <hr className="py-3 mt-2" />

        <input type="hidden" value={post._id} {...register('_id')}/>

        <label className="block mb-5">
          <span className="text-gray-700">Name</span>
          <input 
            className="shaddow border rounded py-2 px-3 form-input mt-1 block w-full ring-yellow-500 focus:ring outline-none"
            type="text" 
            placeholder="John Doe" 
            {...register('name', { required: true })}
          />
        </label> 

        <label className="block mb-5">
          <span className="text-gray-700">Email</span>
          <input 
            className="shaddow border rounded py-2 px-3 form-input mt-1 block w-full ring-yellow-500 focus:ring outline-none" 
            type="email" 
            placeholder="John Doe" 
            {...register('email', { required: true })}
          />
        </label> 

        <label className="block mb-5">
          <span className="text-gray-700">Comment</span>
          <textarea 
            className="shaddow border rounded py-2 px-3 form-textarea mt-1 block w-full ring-yellow-500 focus:ring outline-none" 
            placeholder="John Doe" 
            rows={8}
            {...register("comment", { required: true })}
          />
        </label> 
        
        {/* {errors will return when field validation fails} */}
        <div className="flex flex-col p-5">
          {errors.name && (
            <span className="text-red-500">- The Name Field is required</span>
          )}
          {errors.email && (
            <span className="text-red-500">- The E-mail Field is required</span>
          )}
          {errors.comment && (
            <span className="text-red-500">- The Comment is required</span>
          )}
        </div>

        <button className="shaddow bg-yellow-500 hover:bg-yellow-400 focus:shaddow-outline focus:outline-none text-white font-bold py-2 px-4 rounded cursor-pointer">Submit</button>
 
      </form>
      )}

      <div className="flex flex-col p-10 my-10 max-w-2xl mx-auto shadow-yellow-500 shadow space-y-2">
        <h3 className="text-4xl">Comments</h3>

        <hr className="pb-2"/>

        {post.comments.map((comment) => (
          <div key={comment._id}>
            <p>
              <span className="text-yellow-500">{comment.name}</span>: {comment.comment}</p>
          </div>
        ))}
      </div>
      

      
    </main>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const query = `
    *[_type == "post"]{
      _id,
      slug {
        current
      }
    }
  `;

  const posts = await sanityClient.fetch(query);

  const paths = posts.map((post: IPost) => ({
    params: {
      slug: post.slug.current
    }
  }))

  return {
    paths,
    fallback: 'blocking'
  }
}

export const getStaticProps: GetStaticProps<any, { slug: string }> = async ({params}) => {
  const slug = params?.slug;

  const query = `
    *[_type == "post" && slug.current == $slug][0]{
      _id,
      _createdAt,
      title,
      author -> {
        name,
        image
      },
      'comments': *[
        _type == "comment" && post._ref == ^._id && approved == true
      ],
      description,
      mainImage,
      slug,
      body
    }
  `;
    
  const post = await sanityClient.fetch(query, {slug});

  if(!post) {
    return {
      notFound: true
    }
  }

  return {
    props: {
      post
    },
    revalidate: 60 * 60 * 1, // 1 hour
  }
}